import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  KeepUnlistedProps,
  Option,
  UnlistedPlacementProps,
} from '../types';
import useDisplayOptions from './useDisplayOptions';

const options: Option<string>[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

type Props = {
  options?: Option<string>[];
  value: string[];
} & UnlistedPlacementProps &
  KeepUnlistedProps;

const render = (initialProps: Props) =>
  renderHook(
    ({ options: o = options, value, ...unlisted }: Props) =>
      useDisplayOptions(o, value, unlisted),
    { initialProps },
  );

const values = (result: { current: { displayOptions: { value: string }[] } }) =>
  result.current.displayOptions.map((o) => o.value);

describe('useDisplayOptions', () => {
  it('選択肢外の値を既定では末尾に足す', () => {
    const { result } = render({ value: ['x', 'a'] });

    expect(values(result)).toEqual(['a', 'b', 'x']);
    expect(result.current.unlistedValues).toEqual(['x']);
  });

  it("'hidden' でも unlistedValues は返す", () => {
    const { result } = render({ value: ['x'], unlistedPlacement: 'hidden' });

    expect(values(result)).toEqual(['a', 'b']);
    expect(result.current.unlistedValues).toEqual(['x']);
  });

  it('既定では、value から消えた選択肢外の値は返さない', () => {
    const { result, rerender } = render({ value: ['x'] });

    rerender({ value: [] });

    expect(values(result)).toEqual(['a', 'b']);
  });

  it('keepUnlisted では、value から消えても残し、後から現れた値も現れた順に残す', () => {
    const { result, rerender } = render({ value: ['x'], keepUnlisted: true });

    rerender({ value: [], keepUnlisted: true });
    expect(values(result)).toEqual(['a', 'b', 'x']);

    rerender({ value: ['y'], keepUnlisted: true });
    expect(result.current.unlistedValues).toEqual(['x', 'y']);
  });

  it('後から options に入った値は、選択肢外として扱わない', () => {
    const { result, rerender } = render({ value: ['x'], keepUnlisted: true });

    rerender({
      options: [...options, { value: 'x', label: 'X' }],
      value: ['x'],
      keepUnlisted: true,
    });

    expect(result.current.displayOptions).toEqual([
      { value: 'a', label: 'A', unlisted: false },
      { value: 'b', label: 'B', unlisted: false },
      { value: 'x', label: 'X', unlisted: false },
    ]);
    expect(result.current.unlistedValues).toEqual([]);
  });

  it('値は Object.is で比べる', () => {
    const { result } = renderHook(() =>
      useDisplayOptions([{ value: 0 }], [-0, NaN]),
    );

    expect(result.current.unlistedValues).toEqual([-0, NaN]);
  });
});
