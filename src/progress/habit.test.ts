import { describe, expect, it } from "vitest";
import { addDays, daysBetween, dayKey } from "./dates";
import { addCard, answerCard, dueCards } from "./review";
import { ACTIVE_DAY_SECONDS, currentStreak } from "./streak";

describe("dates", () => {
  it("writes a local day as YYYY-MM-DD", () => {
    expect(dayKey(new Date(2026, 10, 4, 23, 30))).toBe("2026-11-04");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days between two days", () => {
    expect(daysBetween("2026-11-01", "2026-11-15")).toBe(14);
    expect(daysBetween("2026-11-15", "2026-11-01")).toBe(-14);
  });
});

describe("Leitner review", () => {
  const today = "2026-11-14";

  it("adds a new card to box 1, due tomorrow", () => {
    expect(addCard({}, "q-1", today)).toEqual({ "q-1": { box: 1, due: "2026-11-15" } });
  });

  it("leaves a card already in review alone", () => {
    const cards = { "q-1": { box: 4, due: "2026-12-01" } };
    expect(addCard(cards, "q-1", today)).toBe(cards);
  });

  it("moves a right answer up a box, waiting 1, 3, 7, 14 then 30 days", () => {
    let card = answerCard(undefined, true, today);
    const waits = [daysBetween(today, card.due)];
    for (let i = 0; i < 5; i++) {
      card = answerCard(card, true, today);
      waits.push(daysBetween(today, card.due));
    }
    expect(waits).toEqual([1, 3, 7, 14, 30, 30]); // box 5 is the top
    expect(card.box).toBe(5);
  });

  it("sends a wrong answer back to box 1", () => {
    expect(answerCard({ box: 4, due: today }, false, today)).toEqual({ box: 1, due: "2026-11-15" });
  });

  it("lists due cards, oldest first, up to the limit, skipping removed exercises", () => {
    const cards = {
      later: { box: 2, due: "2026-11-20" },
      old: { box: 3, due: "2026-11-01" },
      today: { box: 1, due: today },
      gone: { box: 1, due: "2026-10-01" },
      also: { box: 1, due: "2026-11-01" },
    };
    expect(dueCards(cards, today, 10, (id) => id !== "gone")).toEqual(["also", "old", "today"]);
    expect(dueCards(cards, today, 2, (id) => id !== "gone")).toEqual(["also", "old"]);
  });
});

describe("streak", () => {
  const enough = ACTIVE_DAY_SECONDS;
  const days = (...keys: string[]) => Object.fromEntries(keys.map((key) => [key, enough]));

  it("counts consecutive active days, including today once it is done", () => {
    expect(currentStreak(days("2026-11-12", "2026-11-13", "2026-11-14"), "2026-11-14")).toMatchObject({ days: 3, todayDone: true });
  });

  it("does not break before today's practice", () => {
    expect(currentStreak(days("2026-11-12", "2026-11-13"), "2026-11-14")).toMatchObject({ days: 2, todayDone: false });
  });

  it("ignores days with less than five minutes", () => {
    const activity = { ...days("2026-11-13"), "2026-11-14": enough - 1 };
    expect(currentStreak(activity, "2026-11-14")).toMatchObject({ days: 1, todayDone: false });
  });

  it("forgives one missed day", () => {
    const streak = currentStreak(days("2026-11-10", "2026-11-11", "2026-11-13", "2026-11-14"), "2026-11-14");
    expect(streak).toMatchObject({ days: 4, forgivenDay: "2026-11-12" });
  });

  it("breaks on two missed days in a row", () => {
    expect(currentStreak(days("2026-11-10", "2026-11-13", "2026-11-14"), "2026-11-14").days).toBe(2);
  });

  it("forgives only one missed day per week", () => {
    // Misses on the 9th and the 12th: three days apart, so only the later one is forgiven.
    const activity = days("2026-11-07", "2026-11-08", "2026-11-10", "2026-11-11", "2026-11-13", "2026-11-14");
    expect(currentStreak(activity, "2026-11-14").days).toBe(4);
  });

  it("forgives misses a week or more apart", () => {
    const activity = days("2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14");
    // Missed only the 7th: forgiven. Thirteen practice days.
    expect(currentStreak(activity, "2026-11-14").days).toBe(13);
  });

  it("is zero with no practice at all", () => {
    expect(currentStreak({}, "2026-11-14")).toEqual({ days: 0, todayDone: false, forgivenDay: null });
  });
});
