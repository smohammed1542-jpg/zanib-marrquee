const DAY = { day: 'numeric' };
const MONTH_YEAR = { month: 'long', year: 'numeric' };
const FULL = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

const formatterCache = new Map();

function hijriFormatter(options) {
  const key = JSON.stringify(options);
  const cached = formatterCache.get(key);
  if (cached) return cached;

  const locales = ['ar-SA-u-ca-islamic-umalqura', 'ar-u-ca-islamic'];
  for (const locale of locales) {
    try {
      const fmt = new Intl.DateTimeFormat(locale, options);
      fmt.format(new Date());
      formatterCache.set(key, fmt);
      return fmt;
    } catch {
      /* try the next calendar */
    }
  }

  const fallback = new Intl.DateTimeFormat('ar', options);
  formatterCache.set(key, fallback);
  return fallback;
}

export function formatHijriDay(date) {
  return hijriFormatter(DAY).format(date);
}

export function formatHijriMonthYear(date) {
  return hijriFormatter(MONTH_YEAR).format(date);
}

export function formatHijriFull(date) {
  return hijriFormatter(FULL).format(date);
}

/** Hijri month label for a Gregorian month, including both months when it spans two. */
export function formatHijriMonthSpan(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startLabel = formatHijriMonthYear(start);
  const endLabel = formatHijriMonthYear(end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}
