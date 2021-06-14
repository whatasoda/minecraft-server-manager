import type { NextFunction, Request, Response } from 'express';
import { Credentials, GoogleAuth } from 'google-auth-library';
import { getAuthorizeUrl, getCredentialsByCode, getOAuth2Client } from '../services/auth';
import express from 'express';

declare global {
  namespace Express {
    interface Request {
      authClient: GoogleAuth;
    }
  }
  namespace Dashboard {
    namespace Auth {
      interface GetReq$Login {
        callback?: string;
      }
      interface GetReq$Callback {
        code?: string;
      }
      interface PostReq$Logout {}
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    redirectUrlAfterLogin?: string;
    // email: string;
    credentials: Credentials;
  }
}

const auth = express();
export default auth;

auth.get('/login', (req, res) => {
  const { callback }: Dashboard.Auth.GetReq$Login = req.query;
  if (callback) {
    req.session.redirectUrlAfterLogin = callback;
  }

  const hostname = req.headers.host;
  const baseUrl = req.baseUrl;
  const loginUrl = getAuthorizeUrl(`http://${hostname}${baseUrl}/callback`);
  res.redirect(loginUrl);
});

auth.get('/callback', async (req, res) => {
  const { code }: Dashboard.Auth.GetReq$Callback = req.query;
  try {
    const credentials = await getCredentialsByCode(code!);
    req.session.credentials = credentials;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
    res.redirect('/auth-error');
    return;
  }

  const { redirectUrlAfterLogin } = req.session;
  delete req.session.redirectUrlAfterLogin;
  redirectToSameBase(req, res, redirectUrlAfterLogin, '/');
});

auth.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(503).send('Something Wrong Happens');
    } else {
      res.status(200).send('Successfully Logged Out');
    }
  });
});

const redirectToSameBase = (req: Request, res: Response, url: string | undefined, fallback: string) => {
  const hostname = req.headers.host;
  if (hostname && url && new RegExp(`^https?://${hostname}(/|$)`).test(url)) {
    res.redirect(url);
  } else {
    res.redirect(fallback);
  }
};

export const withAuth = () => async (req: Request, res: Response, next: NextFunction) => {
  const { credentials } = req.session;
  if (!credentials) {
    res.status(403).send('Forbidden');
    return;
  }

  const oAuth2Client = getOAuth2Client(credentials);
  try {
    // it causes refreshing access token
    const cachedRequestHeaders = await oAuth2Client.getRequestHeaders();
    oAuth2Client.getRequestHeaders = async () => cachedRequestHeaders;
    req.session.credentials = oAuth2Client.credentials;
  } catch (e) {
    res.status(403).send('Forbidden');
    return;
  }
  // HACKY: set OAuth2Client instance to `cachedCredential` before being initialized by GoogleAuth instance
  // see: https://github.com/googleapis/google-auth-library-nodejs/blob/241063a8c7d583df53ae616347edc532aec02165/src/auth/googleauth.ts#L814-L830
  req.authClient = new GoogleAuth();
  req.authClient.cachedCredential = oAuth2Client as any;
  next();
};
