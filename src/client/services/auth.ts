import { createUrlSearchParam } from '../utils/url';
const baseUrl = `/api/auth`;

const authService = {
  login(callbackUrl: string): Promise<void> {
    const url = createUrlSearchParam<Dashboard.Auth.GetReq$Login>({ callback: callbackUrl });
    location.href = `${baseUrl}/login?${url}`;
    // fetch('', { redirect: 'manual' });
    return Promise.resolve();
  },
  logout(): Promise<void> {
    return fetch(`${baseUrl}/logout`, { method: 'POST' }).then(
      () => {},
      () => {},
    );
  },
};

export default authService;
