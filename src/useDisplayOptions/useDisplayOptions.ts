import { useState } from 'react';
import includesValue from '../_internal/_includesValue';
import createDisplayOptions from '../createDisplayOptions';
import type {
  KeepUnlistedProps,
  Option,
  UnlistedPlacementProps,
} from '../types';
import type { UseDisplayOptionsResult } from './types';

/**
 * 選んだ値に合わせて、表示する選択肢を作るhook
 *
 * `value` に入っているが `options` に無い値（選択肢外の値）を、`unlistedPlacement` の位置に足す。
 * `keepUnlisted` のときは、マウントしている間に `value` に現れた選択肢外の値を、
 * `value` から消えた後も返し続ける（現れた順）。後から `options` に入った値は、選択肢外として扱わない。
 * 値は `Object.is` で比べる。
 *
 * @param options 選択肢
 * @param value 選んだ値（単独の値の部品は `[value]` のように配列にして渡す）
 * @param props 選択肢外の値の扱い（部品のプロパティをそのまま渡せる）
 * @returns 表示する選択肢と、選択肢外の値
 */
export default function useDisplayOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  {
    unlistedPlacement = 'end',
    keepUnlisted = false,
  }: UnlistedPlacementProps & KeepUnlistedProps = {},
): UseDisplayOptionsResult<V> {
  const listed = options.map((option) => option.value);
  const current = value.filter((v) => !includesValue(listed, v));

  const [kept, setKept] = useState<readonly V[]>(current);
  let unlistedValues = current;
  if (keepUnlisted) {
    const added = current.filter((v) => !includesValue(kept, v));
    if (added.length > 0) {
      // レンダリング中に自分の状態を更新する（React の「前の props から状態を調整する」形）
      setKept([...kept, ...added]);
    }
    unlistedValues = [...kept, ...added].filter(
      (v) => !includesValue(listed, v),
    );
  }

  return {
    displayOptions: createDisplayOptions(
      options,
      unlistedValues,
      unlistedPlacement,
    ),
    unlistedValues,
  };
}
