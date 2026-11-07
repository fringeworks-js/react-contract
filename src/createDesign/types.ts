import type { AdjustColorOptions } from '@fringeworks/design-utils';
import type { AbsoluteColor } from '@fringeworks/types';
import type { DesignDefinition, DesignState } from '../createDesignStyle';

/**
 * `createDesign` に渡す、デザインの元になる値
 *
 * 基本は、ここに挙げたキー（テーマの色の役割の名前）で渡す。当てはまらないものは、任意のキーで渡してよい。
 * どのキーも省略でき、省略したキーを指している割り当ての値は作らない（部品の既定の見た目のまま）。
 */
export type CreateDesignOptions = {
  /**
   * メインの色。チェックした印・フォーカスの線など、強調する部分に使う
   */
  primaryColor?: AbsoluteColor;

  /**
   * メインの色の上に置く文字・印の色。部品の既定の割り当てでは、省略すると白か黒の読みやすい方を選ぶ
   */
  primaryContrastColor?: AbsoluteColor;

  /**
   * エラーの色。`invalid` のときの枠などに使う
   */
  errorColor?: AbsoluteColor;

  /**
   * 灰色の系統の基準の色（枠・控えめな文字など）。ブランドの色味を帯びた灰色でもよい
   */
  neutralColor?: AbsoluteColor;

  /**
   * 角の丸みの基準。ボタン・入力欄などはこの値、チェックボックスの印などはこれを元に小さくした値にする。
   * 数値は px。`'0.5rem'`・`var(--app-radius)` などの CSS の長さも渡せる。大きな値（`9999`）でボタンをピル型にできる
   */
  radius?: number | CssLength;

  /**
   * 部品の中の余白・間隔・大きさの倍率（詰め具合）。`1` が部品の既定。`0.9` で詰め、`1.1` でゆったりさせる
   */
  scaling?: number;

  [key: string]: unknown;
};

/**
 * CSS の長さの書き方（数値と単位、`var()`・`calc()` などの関数）
 *
 * 割り当ての中で、入力のキーと見分けるために使う（キーは識別子の形、長さは数字か関数で始まる）。
 */
type CssLength =
  | `${number}${'px' | 'em' | 'rem' | '%' | 'vw' | 'vh' | 'vmin' | 'vmax' | 'ch' | 'ex' | 'lh' | 'cqi' | 'cqb'}`
  | `${'var' | 'calc' | 'min' | 'max' | 'clamp'}(${string})`;

/**
 * 入力（`CreateDesignOptions` など）のキーのうち、色を渡すもの
 *
 * 任意のキーを受け付けるための index signature（`[key: string]: unknown`）は除く。
 * 除かないと `keyof` が `string` になり、名前の決まったキーが取り出せない。
 */
export type DesignColorKey<O> = keyof {
  [
    K in keyof O as K extends string
      ? string extends K
        ? never
        : Exclude<O[K], undefined> extends AbsoluteColor
          ? K
          : never
      : never
  ]: O[K];
} &
  string;

/**
 * 入力のキーのうち、長さや倍率（数値・CSS の長さ）を渡すもの。色を渡すキーは除く
 */
export type DesignLengthKey<O> = keyof {
  [
    K in keyof O as K extends string
      ? string extends K
        ? never
        : Exclude<O[K], undefined> extends AbsoluteColor
          ? never
          : Exclude<O[K], undefined> extends number | string
            ? K
            : never
      : never
  ]: O[K];
} &
  string;

/**
 * 割り当ての中で、色を指すもの（入力のキーか、具体的な色）
 */
type ColorReference<K extends string> = K | AbsoluteColor;

/**
 * 色を作る指定（JSON にできるデータ）
 *
 * - 入力のキー（`'primaryColor'` など）: その色をそのまま使う
 * - `{ from, adjust?, mix?, ensureContrast?, alpha? }`: 入力の色を変換する。変換は `adjust` → `mix` → `ensureContrast` → `alpha` の順に行う
 * - `{ readableOn, candidates?, minRatio? }`: その色の上で最も読みやすい色を、候補（既定は白と黒）から選ぶ
 * - 配列: 先頭から順に試し、最初に色が決まったものを使う（任意の入力の色を、ほかの指定で補うときなど）
 *
 * 色が決まらない場合（入力に無い・読めない色）は、その値を作らない。
 * データで書けないものは、割り当てに関数（`DesignColorFunction`）を書く。
 *
 * @template K 入力の、色を渡すキー
 */
export type DesignColorSpec<
  K extends string = DesignColorKey<CreateDesignOptions>,
> =
  | K
  | {
      /**
       * 元の色（入力のキー）
       */
      from: K;
      /**
       * 明るさ・彩度・色相を変える（design-utils の `adjustColor`）
       */
      adjust?: AdjustColorOptions;
      /**
       * 別の色と混ぜる。`ratio` は元の色の割合（design-utils の `mixColors`）
       */
      mix?: { with: ColorReference<K>; ratio: number };
      /**
       * `against` とのコントラスト比が `ratio` に届くまで明るさを変える（design-utils の `ensureContrast`）
       */
      ensureContrast?: { against: ColorReference<K>; ratio: number };
      /**
       * 透明度を置き換える（design-utils の `changeAlpha`）
       */
      alpha?: number;
    }
  | {
      /**
       * 背景の色（入力のキー）
       */
      readableOn: K;
      /**
       * 候補の色。省略すると白と黒（design-utils の `chooseReadableColor`）
       */
      candidates?: readonly ColorReference<K>[];
      /**
       * 満たせば選ぶコントラスト比。指定すると、候補を順に見て、比がこの値以上の最初の候補を選ぶ（design-utils の `chooseReadableColor` の `minRatio`）
       */
      minRatio?: number;
    }
  | readonly DesignColorSpec<K>[];

/**
 * 入力を受け取って色を返す関数（データの指定で書けないもの）。色が決まらなければ `undefined` を返す
 *
 * @template O 入力の型
 */
export type DesignColorFunction<O = CreateDesignOptions> = (
  options: O,
) => string | undefined;

/**
 * 割り当ての値（色を作る指定か、色を返す関数）
 */
type DesignColorValue<K extends string, O> =
  DesignColorSpec<K> | DesignColorFunction<O>;

/**
 * 割り当ての中で、長さを指すもの（入力のキーか、数値（px）か、CSS の長さ）
 */
type LengthReference<K extends string> = K | number | CssLength;

/**
 * 長さを作る指定（JSON にできるデータ）
 *
 * - 入力のキー（`'radius'` など）: その値をそのまま使う（数値は px）
 * - `{ from, scale?, min?, max? }`: 元の長さに `scale` を掛け、`min`・`max` の間に収める。
 *   数値と単位だけの長さは計算した値にし、`var()` などを含む長さは `calc()`・`min()`・`max()`・`clamp()` の文字列にする。
 *   `min` が `max` より大きいときは `min` を優先する（CSS の `clamp()` と同じ）
 * - 配列: 先頭から順に試し、最初に値が決まったものを使う
 *
 * 値が決まらない場合（入力に無い）は、その値を作らない。データで書けないものは、割り当てに関数（`DesignLengthFunction`）を書く。
 *
 * @template K 入力の、長さや倍率を渡すキー
 */
export type DesignLengthSpec<
  K extends string = DesignLengthKey<CreateDesignOptions>,
> =
  | K
  | {
      /**
       * 元の長さ（入力のキー、数値（px）、CSS の長さ）
       */
      from: LengthReference<K>;
      /**
       * 掛ける倍率（数値か、数値を渡す入力のキー）
       */
      scale?: number | K;
      /**
       * 下限
       */
      min?: LengthReference<K>;
      /**
       * 上限
       */
      max?: LengthReference<K>;
    }
  | readonly DesignLengthSpec<K>[];

/**
 * 入力を受け取って長さを返す関数（データの指定で書けないもの）。値が決まらなければ `undefined` を返す。数値は px
 *
 * @template O 入力の型
 */
export type DesignLengthFunction<O = CreateDesignOptions> = (
  options: O,
) => string | number | undefined;

/**
 * 割り当ての値（長さを作る指定か、長さを返す関数）
 */
type DesignLengthValue<K extends string, O> =
  DesignLengthSpec<K> | DesignLengthFunction<O>;

/**
 * 長さの値を受け付けるデザインのプロパティ
 */
export type DesignLengthProperty =
  | 'borderWidth'
  | 'borderRadius'
  | 'width'
  | 'height'
  | 'size'
  | 'gap'
  | 'paddingX'
  | 'paddingY'
  | 'marginX'
  | 'marginY';

/**
 * 色の値を受け付けるデザインのプロパティ
 */
export type DesignColorProperty =
  'color' | 'backgroundColor' | 'borderColor' | 'outlineColor';

/**
 * プロパティの種類ごとの、割り当ての値
 */
type TemplateValue<Prop, O> = Prop extends DesignColorProperty
  ? DesignColorValue<DesignColorKey<O>, O>
  : Prop extends DesignLengthProperty
    ? DesignLengthValue<DesignLengthKey<O>, O>
    : never;

type PartTemplate<P, O> = {
  -readonly [
    Prop in keyof P & (DesignColorProperty | DesignLengthProperty)
  ]?: P[Prop] extends readonly (infer S extends DesignState)[]
    ? | TemplateValue<Prop, O>
      | { [State in 'base' | S]?: TemplateValue<Prop, O> }
    : never;
};

/**
 * デザインの割り当て（どのデザインの値に、入力のどの値をどう変えて入れるか）
 *
 * 部品に渡すデザインの値（`Design<D>`）と同じ形で、値の所に、色のプロパティには色を作る指定（`DesignColorSpec`）か関数（`DesignColorFunction`）、
 * 長さのプロパティには長さを作る指定（`DesignLengthSpec`）か関数（`DesignLengthFunction`）を書く。
 * `createDesign` が、入力からデザインの値を作る。書かなかったプロパティ・状態は、デザインの値に入らない（部品の既定の見た目のまま）。
 * 今は色と長さのプロパティだけを受け付ける（`opacity`・`fontWeight` などは受け付けない）。
 *
 * @example
 * const template: DesignTemplate<typeof checkboxDesignDefinition> = {
 *   indicator: {
 *     backgroundColor: { checked: 'primaryColor' },
 *     color: { checked: { readableOn: 'primaryColor' } },
 *     borderRadius: { from: 'radius', scale: 0.5, max: '0.3em' },
 *   },
 * };
 *
 * @template D 部品のデザインの定義
 * @template O 入力の型。割り当てに書けるキーは、この型と `CreateDesignOptions` のキー
 */
export type DesignTemplate<
  D extends DesignDefinition,
  O = CreateDesignOptions,
> = PartTemplate<D['properties'], O & CreateDesignOptions> & {
  -readonly [Part in keyof D['parts']]?: PartTemplate<
    NonNullable<D['parts']>[Part],
    O & CreateDesignOptions
  >;
};
