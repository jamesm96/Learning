// Spaced review with Leitner boxes. A card moves up a box each time you get it right,
// and waits longer before it comes back. Getting it wrong sends it back to box 1.

import { addDays, type DayKey } from "./dates";

/** Days to wait after a right answer, for boxes 1 to 5. */
export const INTERVALS = [1, 3, 7, 14, 30] as const;
export const TOP_BOX = INTERVALS.length;

export interface ReviewCard {
  box: number; // 1 to 5
  due: DayKey; // the card is shown on or after this day
}

/** Recall cards ask you to explain a lesson from memory; their id is "recall:" plus the lesson id. */
export const RECALL_PREFIX = "recall:";

/** Put a new card in box 1, due tomorrow. A card already in review is left as it is. */
export function addCard(cards: Record<string, ReviewCard>, id: string, today: DayKey): Record<string, ReviewCard> {
  if (cards[id]) return cards;
  return { ...cards, [id]: { box: 1, due: addDays(today, INTERVALS[0]) } };
}

/** Move a card after a review: up one box when right, back to box 1 when wrong. */
export function answerCard(card: ReviewCard | undefined, correct: boolean, today: DayKey): ReviewCard {
  const box = correct ? Math.min(TOP_BOX, (card?.box ?? 0) + 1) : 1;
  return { box, due: addDays(today, INTERVALS[box - 1]!) };
}

/**
 * The cards due today or earlier, oldest first, at most `limit`.
 * `exists` filters out cards whose exercise has since been removed from the course.
 */
export function dueCards(
  cards: Record<string, ReviewCard>,
  today: DayKey,
  limit: number,
  exists: (id: string) => boolean = () => true,
): string[] {
  return Object.entries(cards)
    .filter(([id, card]) => card.due <= today && exists(id))
    .sort(([idA, a], [idB, b]) => a.due.localeCompare(b.due) || a.box - b.box || idA.localeCompare(idB))
    .slice(0, limit)
    .map(([id]) => id);
}
