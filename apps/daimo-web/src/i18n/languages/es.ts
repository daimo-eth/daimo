import { LanguageDefinition } from "./en";

export const es: LanguageDefinition = {
  // Common text components
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 manzana"

  if (noun.slice(-3) === "ión") {
    return `${n} ${noun.slice(0, -3)}iones`; // "2 canciones" o "{n} canciones"
  }

  return `${n} ${noun}s`; // "2 manzanas" o "{n} manzanas"
}
