/**
 * 配列に値が含まれるかを `Object.is` で判定する
 *
 * 値を `Object.is` で比べることは、選択肢の部品の契約（README に書いている）。
 * `react-primitives` にも同じものがある。2行の処理のために依存を増やさないよう、共有していない
 */
export default function includesValue<V>(
  values: readonly V[],
  value: V,
): boolean {
  return values.some((v) => Object.is(v, value));
}
