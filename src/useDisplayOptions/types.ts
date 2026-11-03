import type { DisplayOption } from '../types';

export type UseDisplayOptionsResult<V> = {
  /**
   * 表示する選択肢（選択肢外の値を含む）
   */
  displayOptions: DisplayOption<V>[];

  /**
   * 選択肢外の値
   *
   * `keepUnlisted` のときは、選ばなくなったものも含む。`unlistedPlacement` が `'hidden'` でも返す。
   */
  unlistedValues: V[];
};
