export const createUrlSearchParam = <T extends {}>(params: T) => {
  return new URLSearchParams(JSON.parse(JSON.stringify(params))).toString();
};
