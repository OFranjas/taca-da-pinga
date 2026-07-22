export const mergeClasses = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');
