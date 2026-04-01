const STRIP_PATTERNS: RegExp[] = [
  /\[EXTRACTION READY\]/g,
  /\[PREFLIGHT COMPLETE\]/g,
];

export function extractQuestion(text: string): string | null {
  let cleaned = text;
  for (const pattern of STRIP_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  cleaned = cleaned.trim();

  if (!cleaned) return null;

  const matches = cleaned.match(/[^.!?]*[.!?]+(?:\s|$)/g);
  const sentences: string[] = matches ?? [cleaned];

  const questions = sentences.filter((s) => s.includes('?'));

  if (questions.length === 0) return null;

  const last = questions[questions.length - 1].trim();
  if (last.length < 10) return null;

  return last;
}
