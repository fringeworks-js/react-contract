import type { ComponentType } from 'react';
import mergeDesign from '../mergeDesign';
import type { DesignableComponent, FallbackDesign } from './types';

/**
 * アプリで共通のデザインの値を決めた部品を作る HOC
 *
 * `design`（この関数の引数）の値を、部品の `fallbackDesign` プロパティで渡す。
 * 使う場所で渡した `design` には混ぜないので、部品は使う場所の値とアプリで共通の値を分けて扱える
 * （`createEffectiveDesign` で、使う場所の `design` ＞ 部品のプロパティ ＞ `fallbackDesign` の順に重ねる）。
 * アプリで1回作り、画面ではそのまま置く。
 *
 * - 包む部品は、`design`・`fallbackDesign` プロパティを受け取り、静的なプロパティ `designDefinition` にデザインの定義を持つもの
 * - 重ねて使える。使う場所で渡した `fallbackDesign` ＞ 外側の `withDesign` ＞ 内側の `withDesign` の順に優先する（重ね方は `mergeDesign`）
 * - 作ったコンポーネントは、包んだ部品と同じ型で返す（ジェネリックな部品の型引数も残る）。`designDefinition` も引き継ぐ
 *
 * @example
 * const AppCheckbox = withDesign(Checkbox, {
 *   indicator: { backgroundColor: { checked: 'var(--brand-accent)' } },
 * });
 *
 * @param Component 包む部品
 * @param design アプリで共通のデザインの値
 * @returns アプリで共通のデザインの値を決めた部品
 */
export default function withDesign<C extends DesignableComponent>(
  Component: C,
  design: FallbackDesign<C>,
): C {
  const { designDefinition } = Component;
  // 受け取ったプロパティをそのまま渡すので、中では型を広げて描く
  const Inner: ComponentType<Record<string, unknown>> = Component;

  function WithDesign(
    props: Record<string, unknown> & { fallbackDesign?: FallbackDesign<C> },
  ) {
    return (
      <Inner
        {...props}
        fallbackDesign={mergeDesign(
          designDefinition,
          props.fallbackDesign,
          design,
        )}
      />
    );
  }

  WithDesign.displayName = `withDesign(${
    Component.displayName ?? Component.name
  })`;
  WithDesign.designDefinition = designDefinition;

  // 受け取るプロパティは包んだ部品と同じなので、同じ型として返す
  return WithDesign as unknown as C;
}
