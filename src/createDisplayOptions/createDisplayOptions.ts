import type { DisplayOption, Option, UnlistedPlacement } from '../types';

/**
 * 表示する選択肢を作る
 *
 * 受け取った選択肢の `label` を埋め、選択肢外の値を `placement` の位置に足す。
 * 選択肢外の値の `label` は `String(value)`。`placement` が `'hidden'` なら足さない。
 *
 * @param options 選択肢
 * @param unlistedValues 選択肢外の値（`value` に入っているが `options` に無い値）
 * @param placement 選択肢外の値を表示する位置。省略すると `'end'`
 * @returns 表示する選択肢
 */
export default function createDisplayOptions<V>(
  options: readonly Option<V>[],
  unlistedValues: readonly V[],
  placement: UnlistedPlacement = 'end',
): DisplayOption<V>[] {
  const listed: DisplayOption<V>[] = options.map((option) => ({
    ...option,
    label: option.label ?? String(option.value),
    unlisted: false,
  }));
  if (placement === 'hidden') {
    return listed;
  }
  const unlisted: DisplayOption<V>[] = unlistedValues.map((value) => ({
    value,
    label: String(value),
    unlisted: true,
  }));
  return placement === 'start'
    ? [...unlisted, ...listed]
    : [...listed, ...unlisted];
}
