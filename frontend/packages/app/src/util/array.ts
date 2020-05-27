export const insertAfter = <T>(array: T[], insert: T, after?: T) => {
  if (array.length === 0) return [insert];
  const insertIndex = after ? array.indexOf(after) + 1 : array.length - 1;
  return [...array.slice(0, insertIndex), insert, ...array.slice(insertIndex)];
};

export const remove = <T>(array: T[], element: T) => {
  return array.filter((candidate) => candidate !== element);
};
