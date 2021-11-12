#!/bin/bash

RUCIO_HOSTNAME="localhost"
XRD_ARRAY=(XRD1 XRD2 XRD3 XRD4)
declare -A XRD_PORT_MAP=( ["XRD1"]=1094 ["XRD2"]=1095 ["XRD3"]=1096 ["XRD4"]=1097)

# Create test files for upload / download
touch file1 file2 file3 file4

# Create Rucio Storage Elements (RSEs)
for XRD in "${XRD_ARRAY[@]}"
do
  rucio-admin rse add ${XRD}
done

# Add protocol definitions for the storage servers
for XRD in "${XRD_ARRAY[@]}"
do
  rucio-admin rse add-protocol \
        --hostname  ${RUCIO_HOSTNAME}\
        --scheme root \
        --prefix '//rucio/' \
        --port ${XRD_PORT_MAP[${XRD}]} \
        --impl rucio.rse.protocols.xrootd.Default \
        --domain-json '{"wan": {"read": 1, "write": 1, "delete": 1, "third_party_copy": 1}, "lan": {"read": 1, "write": 1, "delete": 1}}' \
        ${XRD}
done

# Enable File Transfer Service (FTS)
for XRD in "${XRD_ARRAY[@]}"
do
  rucio-admin rse set-attribute \
        --rse ${XRD} \
        --key fts \
        --value ${RUCIO_HOSTNAME}:8446
done

# Fake a full mesh network
for XRD_A in "${XRD_ARRAY[@]}"
do
    for XRD_B in "${XRD_ARRAY[@]}"
    do
        if [ $XRD_A != ${XRD_B} ]
        then
            rucio-admin rse add-distance --distance 1 --ranking 1 ${XRD_A} ${XRD_B}
        fi
    done
done

# Indefinite storage quota for root
for XRD in "${XRD_ARRAY[@]}"
do
    rucio-admin account set-limits root ${XRD} -1
done

# Create a default scope for testing
rucio-admin scope add --account root --scope test

# Upload the files
rucio upload --rse XRD1 --scope test file1
rucio upload --rse XRD1 --scope test file2
rucio upload --rse XRD2 --scope test file3
rucio upload --rse XRD2 --scope test file4

# Create a few datasets and containers
rucio add-dataset test:dataset1
rucio attach test:dataset1 test:file1 test:file2

rucio add-dataset test:dataset2
rucio attach test:dataset2 test:file3 test:file4

rucio add-container test:container
rucio attach test:container test:dataset1 test:dataset2

