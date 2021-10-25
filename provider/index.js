const express = require('express');
const { Provider } = require('oidc-provider');
const path = require('path');

const app = express();

//Middleware
app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const configuration = {
    clients: [
        {
            client_id: "client_01",
            client_secret: "secret_01",
            registration_access_token: "rat_01",
            redirect_uris: [
                "http://rucio:8080/auth/oidc_token",
                "http://rucio:8080/auth/oidc_code",
            ],
            client_name: "rucio-auth-client",
            token_endpoint_auth_method: "client_secret_basic",
            scope: "address fts phone openid profile offline_access rucio email wlcg wlcg.groups fts:submit-transfer",
            grant_types: [
                "refresh_token",
                "urn:ietf:params:oauth:grant-type:token-exchange",
                "authorization_code"
            ],
            response_types: [
                "code"
            ],
            jwksType: "URI",
            default_max_age: 60000,
            require_auth_time: true,
            client_secret_expires_at: 0,
        }, {
            client_id: "client_02",
            client_secret: "secret_02",
            registration_access_token: "rat_02",
            redirect_uris: [
                "http://rucio:8080/auth/oidc_token",
                "http://rucio:8080/auth/oidc_code",
            ],
            client_name: "rucio-admin-client",
            token_endpoint_auth_method: "client_secret_basic",
            scope: "address scim:read phone email wlcg profile fts:submit-transfer rucio fts fts:submit-transfer",
            grant_types: [
                "client_credentials"
            ],
            response_types: [],
            jwksType: "URI",
            default_max_age: 60000,
            require_auth_time: true,
            client_secret_expires_at: 0,
        }
    ],
    pkce: {
        required: () => false,
    },
};

const oidc = new Provider('http://oidc-provider:9000', configuration);

app.use("/oidc", oidc.callback());

oidc.listen(9000, () => {
    console.log('oidc-provider listening on port 9000, check http://localhost:9000/.well-known/openid-configuration')
});

