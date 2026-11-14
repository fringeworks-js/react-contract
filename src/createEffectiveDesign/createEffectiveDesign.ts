import type { Design, DesignDefinition } from '../createDesignStyle';
import mergeDesign from '../mergeDesign';
import type { CreateEffectiveDesignOptions } from './types';

/**
 * 部品が受け取ったデザインの値を重ねて、部品に効くデザインの値を作る
 *
 * 使う場所の `design` ＞ 部品のプロパティ（`propsDesign`）＞ アプリで共通の値（`fallbackDesign`）の順に重ねる。
 * 強い方で指定していないプロパティ・状態を、弱い方の値で補う（重ね方は `mergeDesign`）。
 *
 * - 手間をかけて書いた方を優先する。プロパティ（`fontWeight={300}`）より、`design` の状態ごとの値（`{ fontWeight: { hover: 700 } }`）が強い
 * - 層が違うときは、使う場所に近い方を優先する。アプリで共通の値は、使う場所のプロパティより弱い
 *
 * 部品は、受け取ったものをそのまま渡せばよく、重ねる順を知らなくてよい。
 *
 * @example
 * createEffectiveDesign(definition, {
 *   design: { fontWeight: { hover: 700 } },
 *   propsDesign: { fontWeight: 300 },
 *   fallbackDesign: { fontWeight: 500, filled: 1 },
 * });
 * // → { fontWeight: { base: 300, hover: 700 }, filled: 1 }
 *
 * @param definition 部品のデザインの定義
 * @param options 部品が受け取ったデザインの値
 * @returns 部品に効くデザインの値（`createDesignStyle` に渡す）
 */
export default function createEffectiveDesign<D extends DesignDefinition>(
  definition: D,
  { design, propsDesign, fallbackDesign }: CreateEffectiveDesignOptions<D>,
): Design<D> {
  return mergeDesign(
    definition,
    design,
    mergeDesign(definition, propsDesign, fallbackDesign),
  );
}
