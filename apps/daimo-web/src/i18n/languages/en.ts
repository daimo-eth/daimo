export const en = {};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 apple"
  return `${n} ${noun}s`; // "0 apples" or "2 apples"
}

export type LanguageDefinition = typeof en;
