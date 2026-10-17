// e.g. "Cena: 9 499,00 zł" -> "9 499" and "00"
const PRICE_PATTERN = /(\d{1,3}(?:[\s.]\d{3})+|\d+)(?:[,.](\d{2}))?/;

export function parsePolishPrice(priceText: string): number {
  const match = priceText.match(PRICE_PATTERN);

  if (!match) throw new Error(`Cannot parse price from "${priceText}"`);

  const [, integerPart, decimalPart = '00'] = match;

  return parseFloat(`${integerPart.replace(/[\s.]/g, '')}.${decimalPart}`);
}
