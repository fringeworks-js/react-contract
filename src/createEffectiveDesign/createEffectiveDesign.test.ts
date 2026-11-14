import { describe, expect, it } from 'vitest';
import type { DesignDefinition } from '../createDesignStyle';
import createEffectiveDesign from './createEffectiveDesign';

const definition = {
  properties: { fontWeight: ['hover'], filled: ['hover'] },
  parts: { mark: { backgroundColor: ['checked'] } },
} as const satisfies DesignDefinition;

describe('createEffectiveDesign', () => {
  it('何も渡さなければ、空のデザインの値', () => {
    expect(createEffectiveDesign(definition, {})).toEqual({});
  });

  it('プロパティの値は、すべての状態に効く', () => {
    expect(
      createEffectiveDesign(definition, { propsDesign: { fontWeight: 300 } }),
    ).toEqual({ fontWeight: 300 });
  });

  it('design の状態ごとの値は、プロパティより強い。省略した状態はプロパティの値', () => {
    expect(
      createEffectiveDesign(definition, {
        design: { fontWeight: { hover: 700 } },
        propsDesign: { fontWeight: 300 },
      }),
    ).toEqual({ fontWeight: { base: 300, hover: 700 } });
    expect(
      createEffectiveDesign(definition, {
        design: { fontWeight: { base: 500 } },
        propsDesign: { fontWeight: 300 },
      }),
    ).toEqual({ fontWeight: { base: 500, hover: 300 } });
  });

  it('design の1つの値は、プロパティをすべての状態で上書きする', () => {
    expect(
      createEffectiveDesign(definition, {
        design: { fontWeight: 500 },
        propsDesign: { fontWeight: 300 },
      }),
    ).toEqual({ fontWeight: 500 });
  });

  it('プロパティは fallbackDesign より強い。fallbackDesign の状態ごとの値も上書きする', () => {
    expect(
      createEffectiveDesign(definition, {
        propsDesign: { fontWeight: 300 },
        fallbackDesign: { fontWeight: { base: 500, hover: 700 }, filled: 1 },
      }),
    ).toEqual({ fontWeight: 300, filled: 1 });
  });

  it('プロパティの値が undefined なら、指定しなかったものとして扱う', () => {
    expect(
      createEffectiveDesign(definition, {
        propsDesign: { fontWeight: undefined },
        fallbackDesign: { fontWeight: 500 },
      }),
    ).toEqual({ fontWeight: 500 });
  });

  it('部分の値も同じ順で重ねる', () => {
    expect(
      createEffectiveDesign(definition, {
        design: { mark: { backgroundColor: { checked: 'pink' } } },
        fallbackDesign: { mark: { backgroundColor: 'red' } },
      }),
    ).toEqual({ mark: { backgroundColor: { base: 'red', checked: 'pink' } } });
  });
});
