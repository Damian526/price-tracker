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
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`should correctly parse ${description} ("${input}")`, () => {
      const result = parsePolishPrice(input);
      expect(result).toBe(expected);
    });
  });
});
