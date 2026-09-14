/** Roman-inspired names for AI opponents. */

export const AI_NAMES: readonly string[] = [
  'Marcus Fulvius',
  'Livia Drusa',
  'Gaius Sertorius',
  'Octavia Rufa',
  'Titus Manlius',
  'Cornelia Maior',
  'Quintus Varro',
  'Aemilia Tertia',
  'Publius Nasica',
  'Servilia Caepio',
  'Decimus Brutus',
  'Fulvia Flacca',
];

/** Short form for tight UI (first word). */
export function shortName(full: string): string {
  return full.split(' ')[0] ?? full;
}
