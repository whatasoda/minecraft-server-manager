export const createUrlSearchParam = <T extends {}>(params: T) => {
  return new URLSearchParams(params).toString();
};
