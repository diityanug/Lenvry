let idCounter = 0;

/**
 * Generates a collision-resistant ID for local entities (transactions, habits, notes, etc.).
 */
export function generateId(prefix?: string): string {
  idCounter = (idCounter + 1) % 1_000_000;
  const suffix = `${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  return prefix ? `${prefix}_${suffix}` : suffix;
}
