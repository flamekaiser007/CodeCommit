// All dates here are UTC calendar days (YYYY-MM-DD), not timestamps.
// KNOWN LIMITATION: this means the "day" boundary is midnight UTC, not
// midnight in the user's own timezone. Someone in UTC-8 who solves a
// problem at 4pm local time on the 12th, then again at 9am local on the
// 13th, might actually be logging both solves under UTC date "13" if
// their afternoon fell after midnight UTC — which can make a two-day
// streak look like it happened in one day, or vice versa near the
// boundary. Fine for an MVP; the real fix is accepting a per-user
// timezone offset and shifting these calculations by it.

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysUTC(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function yesterdayUTC() {
  return addDaysUTC(todayUTC(), -1);
}

// distinctDatesDesc: array of 'YYYY-MM-DD' strings, already distinct,
// sorted most-recent-first. Returns the current active streak length.
//
// "Active" means: if today has a solve, count backward from today.
// If today has no solve yet but yesterday does, the streak is still
// considered alive (matches how most habit-tracking apps behave — you
// don't lose your streak until the day is actually over).
export function computeCurrentStreak(distinctDatesDesc) {
  if (distinctDatesDesc.length === 0) return 0;

  const set = new Set(distinctDatesDesc);
  const today = todayUTC();
  let cursor = set.has(today) ? today : yesterdayUTC();

  if (!set.has(cursor)) return 0; // no solve today or yesterday -> streak is broken

  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysUTC(cursor, -1);
  }
  return streak;
}

// distinctDatesAsc: same dates, sorted oldest-first. Returns the longest
// run of consecutive days anywhere in the user's history.
export function computeLongestStreak(distinctDatesAsc) {
  if (distinctDatesAsc.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < distinctDatesAsc.length; i++) {
    const prev = distinctDatesAsc[i - 1];
    const curr = distinctDatesAsc[i];
    if (addDaysUTC(prev, 1) === curr) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}