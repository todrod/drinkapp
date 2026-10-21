/**
 * Bounded decoder for lz-string's URI alphabet. Check the expanded length
 * before appending each word, so a shared link cannot expand without limit.
 * Adapted from lz-string, Copyright (c) 2013 pieroxy, MIT licensed.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
export function decompressMenu(input: string, maxLength = 50000): string | null {
  let bit = 0;
  const read = (count: number): number => {
    let value = 0;
    for (let n = 0; n < count; n++, bit++) {
      if (bit >= input.length * 6) throw new Error('truncated');
      const code = ALPHABET.indexOf(input[Math.floor(bit / 6)]);
      if (code < 0) throw new Error('alphabet');
      value += ((code >> (5 - bit % 6)) & 1) * 2 ** n;
    }
    return value;
  };
  try {
    const initial = read(2);
    if (initial === 2) return '';
    if (initial !== 0 && initial !== 1) return null;
    let word = String.fromCharCode(read(initial === 0 ? 8 : 16));
    const dictionary: string[] = ['', '', '', word];
    const result = [word];
    let size = 4; let enlarge = 4; let numBits = 3; let length = word.length;
    while (bit < input.length * 6) {
      let code = read(numBits);
      if (code === 2) return result.join('');
      if (code === 0 || code === 1) {
        dictionary[size++] = String.fromCharCode(read(code === 0 ? 8 : 16));
        code = size - 1; enlarge--;
      }
      if (enlarge === 0) { enlarge = 2 ** numBits; numBits++; }
      const entry = dictionary[code] || (code === size ? word + word[0] : null);
      if (!entry || length + entry.length > maxLength) return null;
      length += entry.length;
      result.push(entry);
      dictionary[size++] = word + entry[0];
      enlarge--; word = entry;
      if (enlarge === 0) { enlarge = 2 ** numBits; numBits++; }
    }
    return null;
  } catch { return null; }
}
