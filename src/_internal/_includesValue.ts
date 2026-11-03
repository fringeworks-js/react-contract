/**
 * 配列に値が含まれるかを `Object.is` で判定する
 */
export default function includesValue<V>(
  values: readonly V[],
  value: V,
): boolean {
  return values.some((v) => Object.is(v, value));
}
