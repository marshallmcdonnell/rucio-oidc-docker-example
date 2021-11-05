# OpenID Connect (OIDC) provider + Rucio server setup w/ Docker

This is a repository to setup an example OIDC provider using
(node-oidc-provider)[https://github.com/panva/node-oidc-provider]
and
(Rucio)[https://rucio.cern.ch/]
using docker-compose.

The purpose of each directory is as follows:
  - [`oidc-provider`](oidc-provider): Contains OIDC provider which Rucio server will be an OIDC client
  - [`rucio-server`](rucio-server): Contains the Rucio server configuration files that are mounted into the necessary Rucio containers
  - [`rucio-ui`](rucio-ui): Contains Rucio UI container build files from [original repo](https://github.com/rucio/containers/tree/master/ui) but modified to allow for using just HTTP (not just HTTPS w/ SSL)

# Notes

* Used Rucio documentation for configuring the server for OIDC AuthN/Z found [here](https://rucio.cern.ch/documentation/installing-rucio-server/#server-configuration-for-open-id-connect-authnz)
* (_currently_) Have hard-coded the Rucio clients into the `oidc-provider` so they are "pre-registered"
* No Rucio Storage Elements (RSEs) are setup, just the Rucio server, database, and UI

# Quickstart

To spin up both the OIDC provider and Rucio, simply issue
```
docker-compose build
docker-compose up
```

* OIDC provider is listening on http://localhost:9000
* Rucio server is listening on http://localhost:8080
* Rucio UI is listening on http://localhost:8443

If you also would like to have xrootd RSEs included, instead use the `docker-compose.xrootd.yml` file:
```
docker-compose -f docker-compose.xrootd.yml build
docker-compose -f docker-compose.xrootd.yml up
```

### Add the OIDC identity to the admin account to finalize OIDC setup

To finalize the OIDC setup, we need to add the local OIDC provider identity to the admin account.


Steps include:

1) We need to get the credentials username and password that the Rucio database init container bootstrapped the Rucio database with.

In the `.env` file, this will be the `RUCIO_USERPASS_IDENTITY` and `RUCIO_USERPASS_PWD`.

We need to do this since we cannot authenticate with Rucio with OIDC yet since there is no matching identity in Rucio that the OIDC provider is going to send back.

Thus, we need to create this identity via authenticating with a different strategy (here, `userpass`)

2) We need to determine what the `SUB` name will be.

When we perform the OIDC flow in the browser, this will be the "name" we enter into the OIDC provider's authentication page.

Our local OIDC provider just takes this name value and returns it as the `SUB` (no accounts required)

3) We are now read to add this identity to the Rucio server to finalize OIDC setup

Re need to run an admin Rucio client in order to add this identity.

There is a dockerized Rucio client setup under `rucio-client/`.

To run this client against the Rucio server, run:
```
./rucio-client/rucio-client/rucio-client-docker http://localhost:8080
```

Below, we will define the variables as:
  - `RUCIO_USERPASS_IDENTITY`: Username for Rucio `userpass` strategy from step (1)
  - `RUCIO_USERPASS_PWD`: Password for Rucio `userpass` strategy from step (1)
  - `RUCIO_SUB_NAME`: The subscriber name we chose in step (2)

With the above credentials and variables defined, we are ready to add the identity via the Rucio client.

Inside the started up client container, run:

```
rucio-admin -S=userpass --user=${RUCIO_USERPASS_IDENTITY} --password=${RUCIO_USERPASS_PWD} identity add --account root --type OIDC --id "SUB=${RUCIO_SUB_NAME}, ISS=http://localhost:9000" --account=root --email "foo@bar.baz"
```

# Example

Using the Rucio client, you can test the setup via a file upload and download.

Steps:

1) Login via OIDC on the CLI
```
rucio -S=OIDC -a=root whoami
```

2) Add a new RSE
```
rucio-admin rse add XRD1
```

3) Specify that this new RSE will use the ROOT protocol
```
rucio-admin rse add-protocol \
    --hostname localhost \
    --scheme root \
    --prefix '//rucio/' \
    --port 1094 \
    --impl rucio.rse.protocols.xrootd.Default \
    --domain-json '{"wan": {"read": 1, "write": 1, "delete": 1, "third_party_copy": 1}, "lan": {"read": 1, "write": 1, "delete": 1}}' \
    XRD1
```

4) Set the file transfer service for this RSE
```
rucio-admin rse set-attribute --rse XRD1 --key fts --value localhost:8446
```

5) Set "indefinite" storage quota for root
```
rucio-admin account set-limits root XRD1 -1
```

6) Create a Rucio "scope" named "test"
```
rucio-admin scope add --account root --scope test
```

7) Create and upload a test file (`file1`) to this new RSE:
```
touch file1
rucio upload --rse XRD1 --scope test file1
```

8) Download the file
```
rucio download test:file1
```

