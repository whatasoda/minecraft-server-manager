const baseUrl = `http://${location.host}/api/user`;

export interface User {
  email: string;
  displayName: string;
  thumbnailUrl: string;
}

const userService = {
  async profile(): Promise<User | null> {
    try {
      const res = await fetch(`${baseUrl}/profile`, { method: 'GET' });
      const { data } = await res.json();
      if (data) {
        return data as User;
      } else {
        throw new Error('Not Logged In');
      }
    } catch (e) {
      alert('');
      return null;
    }
  },
};

export default userService;
