import { describe, expect, it } from 'vitest';
import createSelectedOptions from './createSelectedOptions';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b' },
  { value: 'c', label: 'C', disabled: true },
];

describe('createSelectedOptions', () => {
  it('選んだ値の選択肢を、選んだ順ではなく選択肢の順に並べる', () => {
    expect(createSelectedOptions(options, ['c', 'a'])).toEqual([
      { value: 'a', label: 'A', unlisted: false },
      { value: 'c', label: 'C', disabled: true, unlisted: false },
    ]);
  });

  it('label を省略した選択肢は String(value) にする', () => {
    expect(createSelectedOptions(options, ['b'])).toEqual([
      { value: 'b', label: 'b', unlisted: false },
    ]);
  });

  it('選択肢外の値は、既定では末尾に足す', () => {
    expect(
      createSelectedOptions(options, ['x', 'b']).map((o) => o.value),
    ).toEqual(['b', 'x']);
  });

  it("'start' では選択肢外の値を先頭に、'hidden' では足さない", () => {
    expect(
      createSelectedOptions(options, ['x', 'b'], 'start').map((o) => o.value),
    ).toEqual(['x', 'b']);
    expect(
      createSelectedOptions(options, ['x', 'b'], 'hidden').map((o) => o.value),
    ).toEqual(['b']);
  });

  it('値を Object.is で比べる', () => {
    expect(
      createSelectedOptions([{ value: NaN }, { value: 0 }], [NaN, -0]).map(
        (o) => o.value,
      ),
    ).toEqual([NaN, -0]);
  });

  it('何も選んでいなければ空の配列', () => {
    expect(createSelectedOptions(options, [])).toEqual([]);
  });
});
