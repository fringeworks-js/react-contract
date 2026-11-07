import { fillStyleState } from '@fringeworks/style-utils';
import type {
  Design,
  DesignDefinition,
  DesignPartDefinition,
  DesignProperty,
  DesignState,
  DesignValue,
} from '../createDesignStyle';

type AnyValue = DesignValue<string | number, DesignState>;
type AnyPartDesign = Partial<Record<DesignProperty, AnyValue>>;

/**
 * 部分（またはルート）のデザインの値を重ねる
 */
function mergePart(
  definition: DesignPartDefinition | undefined,
  design: AnyPartDesign | undefined,
  defaultDesign: AnyPartDesign | undefined,
): AnyPartDesign | undefined {
  if (
    definition === undefined ||
    (design === undefined && defaultDesign === undefined)
  ) {
    return undefined;
  }
  const merged: AnyPartDesign = {};
  for (const [property, states] of Object.entries(definition) as [
    DesignProperty,
    readonly DesignState[],
  ][]) {
    const value = design?.[property];
    const defaultValue = defaultDesign?.[property];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        merged[property] = defaultValue;
      }
    } else if (typeof value === 'object' && defaultValue !== undefined) {
      // 状態ごとのオブジェクトで省略した状態を、既定の値で補う
      merged[property] = fillStyleState<string | number, DesignState>(
        value,
        states,
        defaultValue,
      );
    } else {
      merged[property] = value;
    }
  }
  return Object.keys(merged).length === 0 ? undefined : merged;
}

/**
 * 2つのデザインの値を重ねる
 *
 * `design` で指定していないプロパティ・状態を、`defaultDesign` の値で補う。
 * `createDesignStyle` の `defaultDesign` と同じ規則で、定義にあるプロパティだけを扱う。
 *
 * - `design` の1つの値は、`defaultDesign` の値をすべての状態で上書きする
 * - `design` の状態ごとのオブジェクトは、省略した状態を `defaultDesign` で補う
 *
 * @example
 * mergeDesign(definition, { indicator: { backgroundColor: { base: 'blue' } } }, {
 *   gap: 4,
 *   indicator: { backgroundColor: { base: 'red', checked: 'pink' } },
 * });
 * // → { gap: 4, indicator: { backgroundColor: { base: 'blue', checked: 'pink' } } }
 *
 * @param definition 部品のデザインの定義
 * @param design 優先するデザインの値
 * @param defaultDesign `design` で指定していないものを補う、デザインの値
 * @returns 重ねたデザインの値
 */
export default function mergeDesign<D extends DesignDefinition>(
  definition: D,
  design?: Design<D>,
  defaultDesign?: Design<D>,
): Design<D> {
  const values = design as Record<string, unknown> | undefined;
  const defaults = defaultDesign as Record<string, unknown> | undefined;
  const merged: Record<string, unknown> = {
    ...mergePart(
      definition.properties,
      values as AnyPartDesign | undefined,
      defaults as AnyPartDesign | undefined,
    ),
  };
  for (const [part, partDefinition] of Object.entries(definition.parts ?? {})) {
    const partDesign = mergePart(
      partDefinition,
      values?.[part] as AnyPartDesign | undefined,
      defaults?.[part] as AnyPartDesign | undefined,
    );
    if (partDesign !== undefined) {
      merged[part] = partDesign;
    }
  }
  return merged as Design<D>;
}
