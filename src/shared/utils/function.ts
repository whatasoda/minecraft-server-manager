export const bindAll = <T>(functionRecord: T): T => {
  Object.values(functionRecord).forEach((action) => {
    if (action instanceof Function) {
      action.bind(functionRecord);
    }
  });
  return functionRecord;
};
