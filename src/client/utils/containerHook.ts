export default function containerHook<P extends {}, T extends {}>(hook: (props: P) => T) {
  if (process.env.NODE_ENV === 'test') {
    return hook; // TODO: apply jest.fn
  } else {
    return hook;
  }
}
