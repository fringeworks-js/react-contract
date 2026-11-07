import type { StyleStateRecord } from '@fringeworks/style-utils';

/**
 * デザインの値を状態ごとに分けるときの状態
 *
 * 状態が重なったときは、次の順で後のものが勝つ（部品の CSS はこの順に並べる）。
 * `base` → `hover` → `focus` → `active` → `open` → `checked` → `indeterminate` → `readOnly` → `invalid` → `disabled`
 *
 * - `hover`・`active`: CSS の `:hover`・`:active`
 * - `focus`: キーボードで移ったときのフォーカス（CSS の `:focus-visible`）
 * - `open`・`checked`・`indeterminate`・`readOnly`・`invalid`・`disabled`: 値と操作の契約・HTML の同じ名前の状態
 */
export type DesignState =
  | 'hover'
  | 'active'
  | 'focus'
  | 'open'
  | 'checked'
  | 'indeterminate'
  | 'readOnly'
  | 'invalid'
  | 'disabled';

/**
 * デザインの語彙（プロパティの名前と、受け付ける値の型）
 *
 * 名前は CSS のプロパティ名の camelCase（React の `style` に書く名前と同じ）。
 * CSS に無い名前は、次の略記だけを使う。
 *
 * - `size`: `width` と `height`
 * - `paddingX`・`paddingY`・`marginX`・`marginY`: 左右・上下の `padding`・`margin`
 *
 * 長さ（`string | number`）の数値は px、`opacity`・`fontWeight`・`lineHeight` の数値は単位なしで扱う。
 * どの値にも `var(--…)` の文字列を渡せる（テーマの仕組みの CSS 変数につなぐときなど）。
 */
export type DesignPropertyValues = {
  color: string;
  backgroundColor: string;
  borderColor: string;
  outlineColor: string;
  borderWidth: string | number;
  borderRadius: string | number;
  width: string | number;
  height: string | number;
  size: string | number;
  gap: string | number;
  paddingX: string | number;
  paddingY: string | number;
  marginX: string | number;
  marginY: string | number;
  opacity: string | number;
  fontWeight: string | number;
  lineHeight: string | number;
};

/**
 * デザインのプロパティの名前
 */
export type DesignProperty = keyof DesignPropertyValues;

/**
 * 部品（またはその部分）が受け付けるデザインのプロパティと、そのプロパティで効く状態の一覧
 *
 * 状態の一覧が空なら、状態ごとの値は受け付けない（1つの値か `{ base }` だけ）。
 */
export type DesignPartDefinition = {
  readonly [P in DesignProperty]?: readonly DesignState[];
};

/**
 * 部品のデザインの定義
 *
 * 部品が受け付けるデザインの値を宣言する。`Design` の型と、`createDesignStyle` が書く CSS 変数は、この定義から作る。
 */
export type DesignDefinition = {
  /**
   * 部品のルートのプロパティ
   */
  readonly properties?: DesignPartDefinition;

  /**
   * 部品の中の部分ごとのプロパティ。キーは部分の名前（`partsProps` のキー、または部品が描く要素の名前。camelCase）
   */
  readonly parts?: { readonly [part: string]: DesignPartDefinition };
};

/**
 * デザインの値（1つの値か、状態ごとのオブジェクト）
 *
 * style-utils の `StyleState` と同じ意味。状態ごとのオブジェクトの側を `object` に限り、
 * 真偽値などの値が `{ base?: T }`（すべて省略できる型）に当てはまってしまわないようにしている。
 *
 * @template T 値の型
 * @template S そのプロパティで効く状態
 */
export type DesignValue<T, S extends DesignState> =
  T | (StyleStateRecord<T, S> & object);

type PartDesign<D> = {
  -readonly [
    P in keyof D & DesignProperty
  ]?: D[P] extends readonly (infer S extends DesignState)[]
    ? DesignValue<DesignPropertyValues[P], S>
    : never;
};

/**
 * 部品に渡すデザインの値
 *
 * ルートのプロパティを直接書き、部分のプロパティは部分の名前の下に書く。
 * 値は1つの値（すべての状態に効く）か、状態ごとのオブジェクト（`{ base, hover, … }`。省略した状態は部品の既定の値）。
 *
 * @example
 * const design: Design<typeof checkboxDesignDefinition> = {
 *   gap: 8,
 *   indicator: { backgroundColor: { base: '#fff', checked: 'var(--brand-accent)' } },
 * };
 *
 * @template D 部品のデザインの定義
 */
export type Design<D extends DesignDefinition> = PartDesign<D['properties']> & {
  -readonly [K in keyof D['parts']]?: PartDesign<NonNullable<D['parts']>[K]>;
};

/**
 * `createDesignStyle` が作る、CSS 変数の `style`
 */
export type DesignStyle = Record<`--${string}`, string>;
