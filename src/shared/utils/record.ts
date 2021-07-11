export const initRecord = <T, K extends string>(value: T | (() => T), keys: readonly K[]): Record<K, T> => {
  const record = {} as Record<K, T>;
  const getValue = value instanceof Function ? value : () => value;
  keys.forEach((key) => {
    record[key] = getValue();
  });
  return record;
};
