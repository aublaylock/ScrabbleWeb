/**
 * Module-level dictionary singleton.
 * Populated by the server at startup via setDictionary().
 * Stays empty on the client (word validation is server-side only).
 */
export let dictionary: Set<string> = new Set();

export function setDictionary(d: Set<string>): void {
  dictionary = d;
}

export function isValidWord(word: string): boolean {
  return dictionary.has(word.toUpperCase());
}
