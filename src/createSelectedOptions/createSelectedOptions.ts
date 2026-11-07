import includesValue from '../_internal/_includesValue';
import createDisplayOptions from '../createDisplayOptions';
import type { DisplayOption, Option, UnlistedPlacement } from '../types';

/**
 * 選んだ値の表示する選択肢を、入力の部品で表示する順に並べて作る
 *
 * 選んだ値を表示する部品（選んだ値のラベルを並べるものなど）のためのもの。
 * 入力の部品と同じく `createDisplayOptions` で表示する選択肢を作るので、同じ `options`・`value`・`placement` を渡せば、
 * 選択肢外の値の位置と、`'hidden'` のときに出さないことが、入力の部品とそろう。
 *
 * @param options 選択肢
 * @param value 選んだ値
 * @param placement 選択肢外の値を表示する位置。省略すると `'end'`
 * @returns 選んだ値の表示する選択肢（選択肢の順。選択肢外の値は `placement` の位置）
 */
export default function createSelectedOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  placement: UnlistedPlacement = 'end',
): DisplayOption<V>[] {
  const listed = options.map((option) => option.value);
  const unlisted = value.filter((v) => !includesValue(listed, v));
  return createDisplayOptions(options, unlisted, placement).filter((option) =>
    includesValue(value, option.value),
  );
}
