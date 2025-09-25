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

type DecimalLike = {
  toNumber?: () => number;
  toString?: () => string;
};

type MoneyAmountInput = number | string | DecimalLike | null | undefined;

export function amountToMinorUnits(amount: MoneyAmountInput): number | null {
  if (amount === null || amount === undefined) {
    return null;
  }
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? Math.round(amount * 100) : null;
  }
  if (typeof amount === "string") {
    const numeric = Number(amount);
    return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
  }
  if (typeof amount === "object") {
    const decimalLike = amount as DecimalLike;
    if (typeof decimalLike.toNumber === "function") {
      const numeric = decimalLike.toNumber();
      return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
    }
    if (typeof decimalLike.toString === "function") {
      const numeric = Number(decimalLike.toString());
      return Number.isFinite(numeric) ? Math.round(numeric * 100) : null;
    }
  }
  return null;
}

export function formatMoney(minorUnits: number, currency: string, locale: string = DEFAULT_LOCALE) {
  return getMoneyFormatter(currency, locale)(minorUnits);
}

