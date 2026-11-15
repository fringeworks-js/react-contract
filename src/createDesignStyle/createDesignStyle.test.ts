import { describe, expect, expectTypeOf, it } from 'vitest';
import createDesignStyle from './createDesignStyle';
import type { Design, DesignDefinition } from './types';

const definition = {
  properties: { gap: [], opacity: ['disabled'] },
  parts: {
    label: { color: [] },
    indicator: {
      size: [],
      borderRadius: [],
      backgroundColor: ['checked', 'indeterminate'],
      borderColor: ['invalid'],
    },
  },
} as const satisfies DesignDefinition;

describe('createDesignStyle', () => {
  it('ルートと部分のプロパティを、CSS 変数の名前にする', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        gap: '0.5em',
        label: { color: '#333' },
      }),
    ).toEqual({
      '--frg-checkbox-gap': '0.5em',
      '--frg-checkbox-label-color': '#333',
    });
  });

  it('1つの値は、効くすべての状態の変数に書く', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        indicator: { backgroundColor: 'red' },
      }),
    ).toEqual({
      '--frg-checkbox-indicator-backgroundColor': 'red',
      '--frg-checkbox-indicator-backgroundColor-checked': 'red',
      '--frg-checkbox-indicator-backgroundColor-indeterminate': 'red',
    });
  });

  it('状態ごとのオブジェクトは、書いた状態の変数だけを書く', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        indicator: { backgroundColor: { base: '#fff', checked: 'green' } },
        opacity: { disabled: 0.4 },
      }),
    ).toEqual({
      '--frg-checkbox-indicator-backgroundColor': '#fff',
      '--frg-checkbox-indicator-backgroundColor-checked': 'green',
      '--frg-checkbox-opacity-disabled': '0.4',
    });
  });

  it('長さの数値は px、opacity などの数値は単位なし', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        gap: 8,
        opacity: 0.5,
        indicator: { size: 16, borderRadius: '50%' },
      }),
    ).toEqual({
      '--frg-checkbox-gap': '8px',
      '--frg-checkbox-opacity': '0.5',
      '--frg-checkbox-opacity-disabled': '0.5',
      '--frg-checkbox-indicator-size': '16px',
      '--frg-checkbox-indicator-borderRadius': '50%',
    });
  });

  it('可変フォントの軸の数値は単位なし', () => {
    expect(
      createDesignStyle(
        'frg-materialsymbol',
        { properties: { filled: ['hover'], grade: [], opticalSize: [] } },
        { filled: { base: 0, hover: 1 }, grade: -25, opticalSize: 48 },
      ),
    ).toEqual({
      '--frg-materialsymbol-filled': '0',
      '--frg-materialsymbol-filled-hover': '1',
      '--frg-materialsymbol-grade': '-25',
      '--frg-materialsymbol-opticalSize': '48',
    });
  });

  it('rotate の数値は deg、文字列はそのまま', () => {
    expect(
      createDesignStyle(
        'frg-collapsible',
        { parts: { indicator: { rotate: ['open'] } } },
        { indicator: { rotate: { base: -45, open: '0.25turn' } } },
      ),
    ).toEqual({
      '--frg-collapsible-indicator-rotate': '-45deg',
      '--frg-collapsible-indicator-rotate-open': '0.25turn',
    });
  });

  it('scale の数値は単位なし', () => {
    expect(
      createDesignStyle(
        'frg-button',
        { parts: { icon: { scale: [] } } },
        { icon: { scale: 1.4 } },
      ),
    ).toEqual({ '--frg-button-icon-scale': '1.4' });
  });

  it('var(--…) の文字列もそのまま書く', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        label: { color: 'var(--brand-text)' },
      }),
    ).toEqual({ '--frg-checkbox-label-color': 'var(--brand-text)' });
  });

  it('fallbackDesign で、指定していないプロパティ・状態を補う', () => {
    expect(
      createDesignStyle(
        'frg-checkbox',
        definition,
        { indicator: { backgroundColor: { base: 'blue' } } },
        {
          gap: 4,
          indicator: { backgroundColor: { base: 'red', checked: 'pink' } },
        },
      ),
    ).toEqual({
      '--frg-checkbox-gap': '4px',
      '--frg-checkbox-indicator-backgroundColor': 'blue',
      '--frg-checkbox-indicator-backgroundColor-checked': 'pink',
    });
  });

  it('1つの値は、fallbackDesign の状態ごとの値も上書きする', () => {
    expect(
      createDesignStyle(
        'frg-checkbox',
        definition,
        { indicator: { backgroundColor: 'blue' } },
        { indicator: { backgroundColor: { checked: 'pink' } } },
      ),
    ).toEqual({
      '--frg-checkbox-indicator-backgroundColor': 'blue',
      '--frg-checkbox-indicator-backgroundColor-checked': 'blue',
      '--frg-checkbox-indicator-backgroundColor-indeterminate': 'blue',
    });
  });

  it('値が undefined のプロパティは、指定しなかったものとして扱う', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        gap: undefined,
        label: undefined,
      }),
    ).toEqual({});
    expect(createDesignStyle('frg-checkbox', definition)).toEqual({});
  });

  it('定義にないプロパティは書かない', () => {
    expect(
      createDesignStyle('frg-checkbox', definition, {
        color: 'red',
      } as Design<typeof definition>),
    ).toEqual({});
  });

  it('Design の型は、定義にあるプロパティと状態だけを受け付ける', () => {
    type CheckboxDesign = Design<typeof definition>;
    expectTypeOf<CheckboxDesign>().toHaveProperty('indicator');

    const ok: CheckboxDesign = {
      gap: 8,
      label: { color: { base: 'red' } },
      indicator: { backgroundColor: { checked: 'red' } },
    };
    expect(ok).toBeDefined();

    const ng: CheckboxDesign = {
      // @ts-expect-error 定義にない状態
      indicator: { backgroundColor: { hover: 'red' } },
      // @ts-expect-error 値の型が違う
      gap: true,
    };
    expect(ng).toBeDefined();
  });
});
