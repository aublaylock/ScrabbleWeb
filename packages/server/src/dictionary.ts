import * as fs from 'fs';
import * as readline from 'readline';

/**
 * Parse NSWL2023.txt and return a Set of valid uppercase words.
 *
 * The file is a plain word list, one word per line (all caps).
 * Lines may have trailing whitespace or be blank.
 */
export async function loadDictionaryFile(filePath: string): Promise<Set<string>> {
  const dict = new Set<string>();
  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    // Handle plain word list ("CINQ") or prefixed format ("1→CINQ definition")
    let raw = line.trim();
    if (!raw) continue;

    const arrowIdx = raw.indexOf('→');
    if (arrowIdx !== -1) {
      raw = raw.slice(arrowIdx + 1).trimStart();
    }

    // Take the first whitespace-delimited token as the word
    const word = raw.split(/\s/)[0].toUpperCase();
    if (word && /^[A-Z]+$/.test(word)) {
      dict.add(word);
    }
  }

  return dict;
}
