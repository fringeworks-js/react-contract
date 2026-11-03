import { describe, expect, it } from 'vitest';
import type { Option } from '../types';
import createDisplayOptions from './createDisplayOptions';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', disabled: true },
];

describe('createDisplayOptions', () => {
  it('label を埋め、選択肢外の値を既定では末尾に足す', () => {
    expect(createDisplayOptions(options, ['x'])).toEqual([
      { value: 'a', label: 'A', unlisted: false },
      { value: 'b', label: 'b', disabled: true, unlisted: false },
      { value: 'x', label: 'x', unlisted: true },
    ]);
  });

  it("'start' では先頭に足す", () => {
    expect(
      createDisplayOptions(options, ['x', 'y'], 'start').map((o) => o.value),
    ).toEqual(['x', 'y', 'a', 'b']);
  });

  it("'hidden' では足さない", () => {
    expect(
      createDisplayOptions(options, ['x'], 'hidden').map((o) => o.value),
    ).toEqual(['a', 'b']);
  });

  it('選択肢に足したプロパティを残す', () => {
    const described: (Option<number> & { description: string })[] = [
      { value: 1, description: 'one' },
    ];

    expect(createDisplayOptions(described, [])).toEqual([
      { value: 1, label: '1', description: 'one', unlisted: false },
    ]);
  });
});
