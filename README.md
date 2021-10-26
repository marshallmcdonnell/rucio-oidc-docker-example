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

Provider is listening on http://localhost:9000
Rucio server is listening on http://localhost:8080
Rucio UI is listening on http://localhost:8443

Navigate to http://localhost:8443 to test it out!
