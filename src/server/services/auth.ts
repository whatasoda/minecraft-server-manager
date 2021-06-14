import { Credentials, OAuth2Client } from 'google-auth-library';

const scopes: string[] = ['https://www.googleapis.com/auth/compute'];

const getKeys = () => {
  const keys = require('../oauth2.keys.json');
  return [keys.web.client_id, keys.web.client_secret, keys.web.redirect_uris[1]] as const;
};

export const getOAuth2Client = (credentials?: Credentials) => {
  const oAuth2Client = new OAuth2Client(...getKeys());
  if (credentials) {
    oAuth2Client.setCredentials(credentials);
  }
  return oAuth2Client;
};

export const getAuthorizeUrl = (redirect_uri?: string) => {
  return getOAuth2Client().generateAuthUrl({
    scope: scopes,
    redirect_uri,
  });
};

export const getCredentialsByCode = async (code: string) => {
  const oAuth2Client = getOAuth2Client();
  const r = await oAuth2Client.getToken(code);
  return r.tokens;
};
