import type { Design, DesignDefinition } from '../createDesignStyle';
import createDesign from './createDesign';
import type {
  CreateDesignOptions,
  DesignColorKey,
  DesignLengthKey,
  DesignTemplate,
} from './types';

const definition = {
  properties: { color: [], gap: [] },
  parts: {
    mark: {
      backgroundColor: ['checked', 'indeterminate'],
      borderColor: ['checked', 'invalid'],
      color: ['checked'],
      outlineColor: ['focus'],
      borderRadius: [],
      size: [],
    },
  },
} as const satisfies DesignDefinition;

describe('createDesign', () => {
  it('入力のキーの色をそのまま使う（16進数にする）', () => {
    expect(
      createDesign(
        definition,
        {
          color: 'primaryColor',
          mark: { backgroundColor: { checked: 'primaryColor' } },
        },
        { primaryColor: 'red' },
      ),
    ).toEqual({
      color: '#ff0000',
      mark: { backgroundColor: { checked: '#ff0000' } },
    });
  });

  it('書かなかったプロパティ・状態は入れない', () => {
    const design = createDesign(
      definition,
      {
        mark: { backgroundColor: { checked: 'primaryColor' } },
      },
      { primaryColor: '#2f6fde' },
    );
    expect(design).toEqual({
      mark: { backgroundColor: { checked: '#2f6fde' } },
    });
  });

  it('入力に無い色・読めない色を指した値は入れない', () => {
    const template = {
      mark: {
        backgroundColor: {
          checked: 'primaryColor',
          indeterminate: 'errorColor',
        },
        borderColor: 'neutralColor',
      },
    } satisfies DesignTemplate<typeof definition>;
    expect(
      createDesign(definition, template, { primaryColor: '#2f6fde' }),
    ).toEqual({
      mark: { backgroundColor: { checked: '#2f6fde' } },
    });
    expect(
      createDesign(definition, template, { primaryColor: '#zzz' }),
    ).toEqual({});
    expect(createDesign(definition, template, {})).toEqual({});
  });

  it('変換を adjust → mix → ensureContrast → alpha の順に行う', () => {
    const design = createDesign(
      definition,
      {
        mark: {
          backgroundColor: {
            checked: { from: 'primaryColor', adjust: { lightness: 1 } },
            indeterminate: {
              from: 'primaryColor',
              mix: { with: '#ffffff', ratio: 0.2 },
            },
          },
          borderColor: {
            checked: { from: 'primaryColor', alpha: 0.5 },
            invalid: {
              from: 'primaryColor',
              adjust: { lightness: 1 },
              alpha: 0.5,
            },
          },
          outlineColor: {
            focus: {
              from: 'primaryColor',
              adjust: { lightness: 1 },
              ensureContrast: { against: '#ffffff', ratio: 21 },
            },
          },
        },
      },
      { primaryColor: '#2f6fde' },
    );
    expect(design).toEqual({
      mark: {
        backgroundColor: { checked: '#ffffff', indeterminate: '#d5e3fb' },
        borderColor: { checked: '#2f6fde80', invalid: '#ffffff80' },
        outlineColor: { focus: '#000000' },
      },
    });
  });

  it('readableOn は読みやすい色を選ぶ', () => {
    const template = {
      mark: { color: { checked: { readableOn: 'primaryColor' } } },
    } satisfies DesignTemplate<typeof definition>;
    expect(
      createDesign(definition, template, { primaryColor: '#2f6fde' }),
    ).toEqual({
      mark: { color: { checked: '#ffffff' } },
    });
    expect(
      createDesign(definition, template, { primaryColor: '#ffeb3b' }),
    ).toEqual({
      mark: { color: { checked: '#000000' } },
    });
  });

  it('readableOn の minRatio を渡す', () => {
    expect(
      createDesign(
        definition,
        {
          mark: {
            color: { checked: { readableOn: 'primaryColor', minRatio: 3 } },
          },
        },
        { primaryColor: '#e91e63' },
      ),
    ).toEqual({ mark: { color: { checked: '#ffffff' } } });
  });

  it('readableOn の候補に入力のキーを使える', () => {
    expect(
      createDesign(
        definition,
        {
          mark: {
            color: {
              checked: {
                readableOn: 'primaryColor',
                candidates: ['neutralColor', '#ffffff'],
              },
            },
          },
        },
        { primaryColor: '#2f6fde', neutralColor: '#222222' },
      ),
    ).toEqual({ mark: { color: { checked: '#ffffff' } } });
  });

  it('配列は先頭から試し、最初に決まった色を使う', () => {
    const template = {
      mark: {
        color: {
          checked: ['primaryContrastColor', { readableOn: 'primaryColor' }],
        },
      },
    } satisfies DesignTemplate<typeof definition>;
    expect(
      createDesign(definition, template, { primaryColor: '#2f6fde' }),
    ).toEqual({
      mark: { color: { checked: '#ffffff' } },
    });
    expect(
      createDesign(definition, template, {
        primaryColor: '#2f6fde',
        primaryContrastColor: '#ffeb3b',
      }),
    ).toEqual({ mark: { color: { checked: '#ffeb3b' } } });
  });

  it('関数で色を作れる', () => {
    expect(
      createDesign(
        definition,
        {
          mark: {
            backgroundColor: {
              checked: (options) => `var(--brand, ${options.primaryColor})`,
            },
          },
        },
        { primaryColor: '#2f6fde' },
      ),
    ).toEqual({
      mark: { backgroundColor: { checked: 'var(--brand, #2f6fde)' } },
    });
  });

  it('任意のキーを使える', () => {
    expect(
      createDesign(
        definition,
        {
          mark: { backgroundColor: { checked: 'brandAccentColor' } },
        },
        { brandAccentColor: '#ff0000' },
      ),
    ).toEqual({ mark: { backgroundColor: { checked: '#ff0000' } } });
  });

  describe('長さ', () => {
    const radius = (
      template: DesignTemplate<typeof definition>,
      options: CreateDesignOptions,
    ) => createDesign(definition, template, options).mark?.borderRadius;

    it('入力のキーの値をそのまま使う（数値は px）', () => {
      expect(radius({ mark: { borderRadius: 'radius' } }, { radius: 8 })).toBe(
        8,
      );
      expect(
        radius({ mark: { borderRadius: 'radius' } }, { radius: '0.5rem' }),
      ).toBe('0.5rem');
    });

    it('倍率を掛ける。数値と単位だけの長さは計算し、それ以外は calc() にする', () => {
      const template = {
        mark: { borderRadius: { from: 'radius', scale: 0.5 } },
      } as const;
      expect(radius(template, { radius: 8 })).toBe(4);
      expect(radius(template, { radius: '0.5rem' })).toBe('0.25rem');
      expect(radius(template, { radius: 'var(--app-radius)' })).toBe(
        'calc(var(--app-radius) * 0.5)',
      );
    });

    it('上限・下限に収める', () => {
      expect(
        radius(
          { mark: { borderRadius: { from: 'radius', scale: 0.5, max: 6 } } },
          { radius: 16 },
        ),
      ).toBe(6);
      expect(
        radius(
          {
            mark: {
              borderRadius: { from: 'radius', scale: 0.5, max: '0.3em' },
            },
          },
          { radius: 16 },
        ),
      ).toBe('min(8px, 0.3em)');
      expect(
        radius(
          { mark: { borderRadius: { from: 'radius', min: 2 } } },
          { radius: 'var(--r)' },
        ),
      ).toBe('max(var(--r), 2px)');
      expect(
        radius(
          { mark: { borderRadius: { from: 'radius', min: 2, max: '1em' } } },
          { radius: 'var(--r)' },
        ),
      ).toBe('clamp(2px, var(--r), 1em)');
    });

    it('下限が上限より大きいときは下限を優先する', () => {
      expect(
        radius(
          { mark: { borderRadius: { from: 'radius', min: 10, max: 4 } } },
          { radius: 8 },
        ),
      ).toBe(10);
    });

    it('倍率に入力のキーを使える（具体的な長さに、入力の倍率を掛ける）', () => {
      const template = { gap: { from: '6px', scale: 'scaling' } } as const;
      expect(createDesign(definition, template, { scaling: 0.9 })).toEqual({
        gap: '5.4px',
      });
      expect(
        createDesign(
          definition,
          { gap: { from: '0.875em', scale: 'scaling' } },
          { scaling: 0.9 },
        ),
      ).toEqual({ gap: '0.788em' });
      // 倍率の入力が無ければ作らない
      expect(createDesign(definition, template, {})).toEqual({});
    });

    it('入力に無いキーを指した値は作らない', () => {
      expect(
        radius({ mark: { borderRadius: { from: 'radius', scale: 0.5 } } }, {}),
      ).toBeUndefined();
      // 任意のキー brandRadius は、型の上ではありうるが、渡していない
      const options: { radius: number; brandRadius?: number } = { radius: 8 };
      expect(
        createDesign(
          definition,
          { mark: { borderRadius: { from: 'radius', max: 'brandRadius' } } },
          options,
        ),
      ).toEqual({});
    });

    it('配列は先頭から試す', () => {
      const options: { radius: number; brandRadius?: number } = { radius: 8 };
      expect(
        createDesign(
          definition,
          { mark: { borderRadius: ['brandRadius', 'radius'] } },
          options,
        ),
      ).toEqual({ mark: { borderRadius: 8 } });
    });

    it('関数で長さを作れる', () => {
      expect(
        radius(
          {
            mark: {
              borderRadius: (options) =>
                options.radius === undefined ? undefined : '50%',
            },
          },
          { radius: 1 },
        ),
      ).toBe('50%');
    });
  });

  it('型', () => {
    expectTypeOf<DesignLengthKey<CreateDesignOptions>>().toEqualTypeOf<
      'radius' | 'scaling'
    >();
    createDesign(
      definition,
      {
        // @ts-expect-error 長さのプロパティに色の指定
        mark: { borderRadius: { readableOn: 'primaryColor' } },
      },
      { primaryColor: '#2f6fde' },
    );
    createDesign(
      definition,
      {
        // @ts-expect-error 長さの指定の入力のキーの書き間違い
        mark: { borderRadius: { from: 'radus' } },
      },
      { radius: 8 },
    );
    createDesign(
      definition,
      {
        // @ts-expect-error 色のプロパティに長さの指定
        mark: { backgroundColor: { checked: { from: 'radius', scale: 0.5 } } },
      },
      { radius: 8 },
    );
    expectTypeOf<DesignColorKey<CreateDesignOptions>>().toEqualTypeOf<
      'primaryColor' | 'primaryContrastColor' | 'errorColor' | 'neutralColor'
    >();
    expectTypeOf(
      createDesign(definition, {}, { primaryColor: '#2f6fde' }),
    ).toEqualTypeOf<Design<typeof definition>>();
    createDesign(
      definition,
      {
        // @ts-expect-error 定義に無い状態
        mark: { backgroundColor: { hover: 'primaryColor' } },
      },
      { primaryColor: '#2f6fde' },
    );
    createDesign(
      definition,
      {
        // @ts-expect-error 入力に無いキー
        mark: { backgroundColor: 'primaryColr' },
      },
      { primaryColor: '#2f6fde' },
    );
    createDesign(
      definition,
      {
        // @ts-expect-error 色でないプロパティ
        gap: 'primaryColor',
      },
      { primaryColor: '#2f6fde' },
    );
  });
});
