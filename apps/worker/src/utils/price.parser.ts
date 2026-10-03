export function parsePolishPrice(priceText: string): number {
  const cleanText = priceText
    .replace(/zł/gi, '')
    .replace(/\s/g, '')
    .replace(/\u00a0/g, '')
    .replace(',', '.');
  return parseFloat(cleanText);
}
