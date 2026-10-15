export function parsePolishPrice(priceText: string): number | null {
  // Finds the first sequence of numbers, optional spaces, and a comma or dot
  // e.g., from "Cena: 9 499,00 zł9 499..." it grabs "9 499,00"
  const match = priceText.match(/(\d[\d\s]*[,.]\d{2})/);

  if (!match) return null;

  const cleanedText = match[0]
    .replace(/\s/g, '')
    .replace(/\u00a0/g, '')
    .replace(',', '.');

  return parseFloat(cleanedText);
}
