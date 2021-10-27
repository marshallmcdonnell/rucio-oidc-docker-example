const express = require('express');
const { Provider } = require('oidc-provider');
const path = require('path');

const app = express();

//Middleware
app.use(express.static(__dirname + '/public'))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const rucioAuthClient = {
    client_id: "client_01",
    client_secret: "secret_01",
    registration_access_token: "rat_01",
    redirect_uris: [
        "http://localhost:8080/auth/oidc_token",
        "http://localhost:8080/auth/oidc_code",
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
}

const rucioAdminClient = {
    client_id: "client_02",
    client_secret: "secret_02",
    registration_access_token: "rat_02",
    redirect_uris: [
        "http://localhost:8080/auth/oidc_token",
        "http://localhost:8080/auth/oidc_code",
    ],
    client_name: "rucio-admin-client",
    token_endpoint_auth_method: "client_secret_basic",
    scope: "address scim:read phone email wlcg profile fts:submit-transfer rucio fts",
    grant_types: [
        "client_credentials"
    ],
    response_types: [],
    jwksType: "URI",
    default_max_age: 60000,
    require_auth_time: true,
    client_secret_expires_at: 0,
}

const scopes = [
    "address",
    "email",
    "fts",
    "fts:submit-transfer",
    "offline_access",
    "openid",
    "phone",
    "profile",
    "rucio",
    "scim:read",
    "wlcg",
    "wlcg.groups",
]

const configuration = {
    features: {
        clientCredentials: {
            enabled: true
        }
    },
    scopes: scopes,
    clients: [
        rucioAuthClient,
        rucioAdminClient
    ],
    pkce: {
        required: () => false,
    },
};

const oidc = new Provider('http://localhost:9000', configuration);

// token exchange
const grantType = 'urn:ietf:params:oauth:grant-type:token-exchange';
const parameters = ['scope', 'subject_token', 'subject_token_type'];
oidc.registerGrantType(
    grantType,
    async (ctx, next) => {
      const { AccessToken } = provider;
      const scopeParams = ctx.oidc.params.scope;
      const scopes = [...new Set(scopeParams.split(' '))];

      //checkScope(ctx);

      const subject_token_type = ctx.oidc.params.subject_token_type;
      if (!subject_token_type) {
        throw new errors.InvalidRequest('missing parameter subject_token_type.');
      }
      if (subject_token_type !== 'urn:ietf:params:oauth:token-type:access_token') {
        throw new errors.InvalidRequest('unsupported subject_token_type.');
      }
      const subjectToken = ctx.oidc.params.subject_token;

      const accessToken = await provider.AccessToken.find(subjectToken, { ignoreExpiration: true });
      if (!accessToken || accessToken.isExpired) {
        throw new errors.InvalidGrant('Invalid token');
      }
      const account = await AccountService.findUser(ctx.oidc.client.clientId, accessToken.accountId, null);
      if (!account) {
        throw new errors.InvalidGrant('Invalid token');
      }

      const newAccessToken = new AccessToken({
        accountId: accessToken.accountId,
        claims: accessToken.claims,
        client: ctx.oidc.client,
        expiresWithSession: false,
        grantId: session.grantIdFor(ctx.oidc.client.clientId),
        gty: 'urn:ietf:params:oauth:grant-type:token-exchange',
        sessionUid: accessToken.sessionUid,
        sid: accessToken.sid,
        scope: scopes.join(' ') || undefined,
      });

      ctx.oidc.entity('AccessToken', newAccessToken);
      const newAccessTokenValue = await newAccessToken.save();

      ctx.body = {
        access_token: newAccessTokenValue,
        expires_in: token.expiration,
        token_type: token.tokenType,
        scope: token.scope,
      };

      await next();
    },
    parameters,
);

app.use("/oidc", oidc.callback());

oidc.listen(9000, () => {
    console.log('oidc-provider listening on port 9000, check http://localhost:9000/.well-known/openid-configuration')
});

