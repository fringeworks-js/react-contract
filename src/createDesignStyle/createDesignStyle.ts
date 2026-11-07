import appendUnit from '@fringeworks/design-utils/appendUnit';
import { fillStyleState } from '@fringeworks/style-utils';
import type {
  Design,
  DesignDefinition,
  DesignPartDefinition,
  DesignProperty,
  DesignState,
  DesignStyle,
  DesignValue,
} from './types';

/**
 * 数値を単位なしで扱うプロパティ（それ以外の数値は px）
 */
const UNITLESS: ReadonlySet<DesignProperty> = new Set([
  'opacity',
  'fontWeight',
  'lineHeight',
]);

type AnyValue = DesignValue<string | number, DesignState>;
type AnyPartDesign = Partial<Record<DesignProperty, AnyValue>>;

/**
 * 部分（またはルート）のデザインの値を、CSS 変数にして `style` に書き込む
 */
function writePart(
  style: DesignStyle,
  base: string,
  definition: DesignPartDefinition | undefined,
  design: AnyPartDesign | undefined,
  defaultDesign: AnyPartDesign | undefined,
) {
  if (definition === undefined) {
    return;
  }
  for (const [property, states] of Object.entries(definition) as [
    DesignProperty,
    readonly DesignState[],
  ][]) {
    const filled = fillStyleState(
      design?.[property],
      states,
      defaultDesign?.[property],
    );
    for (const [state, value] of Object.entries(filled) as [
      'base' | DesignState,
      string | number | undefined,
    ][]) {
      if (value === undefined) {
        continue;
      }
      const name = state === 'base' ? property : `${property}-${state}`;
      style[`--${base}-${name}`] =
        typeof value === 'number' && !UNITLESS.has(property)
          ? appendUnit(value)
          : String(value);
    }
  }
}

/**
 * デザインの値を、部品の CSS 変数の `style` にする
 *
 * CSS 変数の名前は `--<prefix>[-<部分>]-<プロパティ>[-<状態>]`（guidelines/css-naming.md の形）。
 * 定義にあるプロパティだけを書き、値が決まらないもの（指定していないもの）は書かない。
 *
 * - 1つの値は、そのプロパティで効くすべての状態の変数に書く（`'red'` なら `-hover` なども `red`）
 * - 状態ごとのオブジェクトは、書いた状態の変数だけを書く（省略した状態は、部品の CSS の既定の値のまま）
 * - `defaultDesign` を渡すと、`design` で指定していないプロパティ・状態を、その値で補う（アプリで決めた既定の値など）
 * - 長さの数値は px を付け、`opacity`・`fontWeight`・`lineHeight` の数値は単位なしで書く
 *
 * @example
 * createDesignStyle('frg-checkbox', definition, {
 *   indicator: { backgroundColor: { checked: 'green' } },
 * });
 * // → { '--frg-checkbox-indicator-backgroundColor-checked': 'green' }
 *
 * @param prefix CSS 変数の名前の、部分より前（`frg-checkbox` など。`--` は付けない）
 * @param definition 部品のデザインの定義
 * @param design デザインの値
 * @param defaultDesign `design` で指定していないものを補う、デザインの値
 * @returns CSS 変数の `style`（要素の `style` に重ねる）
 */
export default function createDesignStyle<D extends DesignDefinition>(
  prefix: string,
  definition: D,
  design?: Design<D>,
  defaultDesign?: Design<D>,
): DesignStyle {
  const style: DesignStyle = {};
  const values = design as Record<string, unknown> | undefined;
  const defaults = defaultDesign as Record<string, unknown> | undefined;
  writePart(
    style,
    prefix,
    definition.properties,
    values as AnyPartDesign | undefined,
    defaults as AnyPartDesign | undefined,
  );
  for (const [part, partDefinition] of Object.entries(definition.parts ?? {})) {
    writePart(
      style,
      `${prefix}-${part}`,
      partDefinition,
      values?.[part] as AnyPartDesign | undefined,
      defaults?.[part] as AnyPartDesign | undefined,
    );
  }
  return style;
}
