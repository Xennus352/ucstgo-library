const UNICODE_DIGIT_BLOCKS: Array<[number, number]> = [
  [0x0660, 0x0669], // Arabic-Indic
  [0x06f0, 0x06f9], // Extended Arabic-Indic
  [0x0966, 0x096f], // Devanagari
  [0x09e6, 0x09ef], // Bengali
  [0x0a66, 0x0a6f], // Gurmukhi
  [0x0ae6, 0x0aef], // Gujarati
  [0x0b66, 0x0b6f], // Oriya
  [0x0be6, 0x0bef], // Tamil
  [0x0c66, 0x0c6f], // Telugu
  [0x0ce6, 0x0cef], // Kannada
  [0x0d66, 0x0d6f], // Malayalam
  [0x0e50, 0x0e59], // Thai
  [0x0ed0, 0x0ed9], // Lao
  [0x0f20, 0x0f29], // Tibetan
  [0x1040, 0x1049], // Myanmar
  [0x17e0, 0x17e9], // Khmer
  [0x1810, 0x1819], // Mongolian
  [0xff10, 0xff19], // Fullwidth
];

// Converts Unicode digits (e.g. Burmese ၀၁၂၃, Arabic ٠١٢) to ASCII digits
// so numeric inputs that reject non-ASCII digits display what was typed.
export function toAsciiDigits(value: string): string {
  return value.replace(/[^\x00-\x7f]/g, (ch) => {
    const cp = ch.codePointAt(0);
    if (cp === undefined) return ch;
    for (const [start, end] of UNICODE_DIGIT_BLOCKS) {
      if (cp >= start && cp <= end) return String(cp - start);
    }
    return ch;
  });
}
