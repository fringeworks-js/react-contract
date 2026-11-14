import type { ComponentType } from 'react';
import type { Design, DesignDefinition } from '../createDesignStyle';

/**
 * `withDesign` で包める部品
 *
 * `design`・`fallbackDesign` プロパティでデザインの値を受け取り、静的なプロパティ `designDefinition` にデザインの定義を持つ部品。
 *
 * @template D 部品のデザインの定義
 */
export type DesignableComponent<D extends DesignDefinition = DesignDefinition> =
  // 部品のほかのプロパティは問わない（作ったコンポーネントは、受け取った部品と同じ型にする）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ComponentType<any> & {
    /**
     * 部品のデザインの定義
     */
    designDefinition: D;
  };

/**
 * `withDesign` に渡す、アプリで共通のデザインの値（部品の `fallbackDesign` プロパティで渡す）
 *
 * @template C 包む部品
 */
export type FallbackDesign<C extends DesignableComponent> = Design<
  C['designDefinition']
>;
