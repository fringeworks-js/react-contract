import { describe, expect, it } from 'vitest';
import type { DesignDefinition } from '../createDesignStyle';
import mergeDesign from './mergeDesign';

const definition = {
  properties: { gap: [], opacity: ['disabled'] },
  parts: {
    indicator: {
      size: [],
      backgroundColor: ['checked', 'indeterminate'],
    },
  },
} as const satisfies DesignDefinition;

describe('mergeDesign', () => {
  it('指定していないプロパティを、defaultDesign で補う', () => {
    expect(
      mergeDesign(definition, { gap: 8 }, { gap: 4, indicator: { size: 16 } }),
    ).toEqual({ gap: 8, indicator: { size: 16 } });
  });

  it('状態ごとのオブジェクトで省略した状態を、defaultDesign で補う', () => {
    expect(
      mergeDesign(
        definition,
        { indicator: { backgroundColor: { base: 'blue' } } },
        { indicator: { backgroundColor: { base: 'red', checked: 'pink' } } },
      ),
    ).toEqual({
      indicator: { backgroundColor: { base: 'blue', checked: 'pink' } },
    });
  });

  it('defaultDesign の1つの値は、省略した状態すべてを補う', () => {
    expect(
      mergeDesign(
        definition,
        { indicator: { backgroundColor: { checked: 'blue' } } },
        { indicator: { backgroundColor: 'red' } },
      ),
    ).toEqual({
      indicator: {
        backgroundColor: { base: 'red', checked: 'blue', indeterminate: 'red' },
      },
    });
  });

  it('design の1つの値は、defaultDesign をすべての状態で上書きする', () => {
    expect(
      mergeDesign(
        definition,
        { opacity: 0.3 },
        { opacity: { base: 1, disabled: 0.5 } },
      ),
    ).toEqual({ opacity: 0.3 });
  });

  it('どちらかを省略したら、もう一方をそのまま使う', () => {
    const design = { gap: 8, indicator: { size: 16 } };
    expect(mergeDesign(definition, design)).toEqual(design);
    expect(mergeDesign(definition, undefined, design)).toEqual(design);
    expect(mergeDesign(definition)).toEqual({});
  });

  it('値が undefined のプロパティは、指定しなかったものとして補う', () => {
    expect(mergeDesign(definition, { gap: undefined }, { gap: 4 })).toEqual({
      gap: 4,
    });
  });
});
