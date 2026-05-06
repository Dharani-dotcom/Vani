
/**
 * Simple mapping for common diacritics
 */
const DIACRITIC_MAP: Record<string, string> = {
  'r': 'ṛ',
  's': 'ṣ',
  'n': 'ṇ',
  'm': 'ṃ',
  't': 'ṭ',
  'd': 'ḍ',
  'l': 'ḷ',
  // You can expand this mapping as needed
};

/**
 * Replace common characters with their diacritic counterparts in specific contexts.
 * For a real automatic system, you would need a dictionary or a more advanced heuristic.
 * Here, we use a simple placeholder technique:
 * Replace a character only if it is followed by a special marker (like !)
 * Example: K!r!ishna -> Kṛṣṇa
 */
export const applyDiacritics = (text: string | null | undefined): string => {
  const safeText = String(text || '');
  return safeText.replace(/([a-zA-Z])!/g, (match, char) => {
    return DIACRITIC_MAP[char.toLowerCase()] || char;
  });
};
