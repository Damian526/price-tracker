import { parsePolishPrice } from './price.parser';

describe('Price Parser (Unit)', () => {
  // We use a table of inputs and expected outputs to test all edge cases instantly
  const testCases = [
    { input: '1 299,99 zł', expected: 1299.99, description: 'standard format' },
    {
      input: '89,00zł',
      expected: 89.0,
      description: 'no space before currency',
    },
    {
      input: '4 500.50',
      expected: 4500.5,
      description: 'dot instead of comma, no currency',
    },
    {
      input: '1\u00a0299,99 zł',
      expected: 1299.99,
      description: 'non-breaking space',
    },
    { input: '499 zł', expected: 499, description: 'no grosze' },
    {
      input: 'Cena: 9 499,00 zł9 499',
      expected: 9499,
      description: 'label prefix and duplicated price',
    },
    {
      input: '1.299,99 zł',
      expected: 1299.99,
      description: 'dot as thousands separator',
    },
    {
      input: '1299,99 zł',
      expected: 1299.99,
      description: 'no thousands separator',
    },
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`should correctly parse ${description} ("${input}")`, () => {
      const result = parsePolishPrice(input);
      expect(result).toBe(expected);
    });
  });

  it('should throw when the text contains no price', () => {
    expect(() => parsePolishPrice('Produkt niedostępny')).toThrow(
      'Cannot parse price from "Produkt niedostępny"',
    );
  });
});
