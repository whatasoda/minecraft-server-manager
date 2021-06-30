import sliceLine from './slice-line';

const testData = ['abcd', 'efgh', 'ijkl', 'mnop', 'qrst', 'uvwx', 'yz'].join('\n');

describe('sliceLine', () => {
  describe('if no cursor specified', () => {
    it('should return last N lines of received string if negative stride', () => {
      const { data: result, start, end } = sliceLine(testData, -2);
      expect(result).toBe('uvwx\nyz');
      expect(result).toBe(testData.slice(start, end));
    });
    it('should return empty string if positive stride', () => {
      const { data: result, start, end } = sliceLine(testData, 10);
      expect(result).toBe('');
      expect(result).toBe(testData.slice(start, end));
    });
  });

  describe('if cursor specified', () => {
    it.each`
      cursor | stride | expected            | start | end
      ${0}   | ${-2}  | ${''}               | ${0}  | ${0}
      ${4}   | ${-2}  | ${'abcd\n'}         | ${0}  | ${5}
      ${5}   | ${-2}  | ${'abcd\n'}         | ${0}  | ${5}
      ${7}   | ${-1}  | ${'ef'}             | ${5}  | ${7}
      ${7}   | ${3}   | ${'gh\nijkl\nmnop'} | ${7}  | ${19}
      ${19}  | ${2}   | ${'\nqrst'}         | ${19} | ${24}
    `('should return content without duplication if cursor is specified correctly', (inputs: any) => {
      const { cursor, stride, expected, start, end } = inputs as {
        cursor: number;
        stride: number;
        expected: string;
        start: number;
        end: number;
      };
      const result = sliceLine(testData, stride, cursor);
      expect(result.data).toBe(expected);
      expect(result.start).toBe(start);
      expect(result.end).toBe(end);
      expect(result.data).toBe(testData.slice(start, end));
    });
  });
});
