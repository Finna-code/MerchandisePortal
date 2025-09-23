const DEFAULT_LOCALE = "en-IN";

const formatterCache = new Map<string, Intl.NumberFormat>();

function getIntlFormatter(currency: string, locale: string) {
  const key = `${locale}-${currency}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function getMoneyFormatter(currency: string, locale: string = DEFAULT_LOCALE) {
  const intlFormatter = getIntlFormatter(currency, locale);
  return (minorUnits: number) => intlFormatter.format((minorUnits ?? 0) / 100);
}

export function formatMoney(minorUnits: number, currency: string, locale: string = DEFAULT_LOCALE) {
  return getMoneyFormatter(currency, locale)(minorUnits);
}

