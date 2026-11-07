import type { ComponentType } from 'react';
import mergeDesign from '../mergeDesign';
import type { DefaultDesign, DesignableComponent } from './types';

/**
 * デザインの既定の値を決めた部品を作る HOC
 *
 * 使う場所で渡した `design` で指定していないプロパティ・状態を、`design`（この関数の引数）の値で補って、部品に渡す
 * （重ね方は `mergeDesign`）。アプリで1回作り、画面ではそのまま置く。
 *
 * - 包む部品は、`design` プロパティを受け取り、静的なプロパティ `designDefinition` にデザインの定義を持つもの
 * - 重ねて使える。外側の `withDesign` ほど優先する（使う場所の `design` > 外側 > 内側 > 部品の CSS の既定の値）
 * - 作ったコンポーネントは、包んだ部品と同じ型で返す（ジェネリックな部品の型引数も残る）。`designDefinition` も引き継ぐ
 *
 * @example
 * const AppCheckbox = withDesign(Checkbox, {
 *   indicator: { backgroundColor: { checked: 'var(--brand-accent)' } },
 * });
 *
 * @param Component 包む部品
 * @param design 既定のデザインの値
 * @returns デザインの既定の値を決めた部品
 */
export default function withDesign<C extends DesignableComponent>(
  Component: C,
  design: DefaultDesign<C>,
): C {
  const { designDefinition } = Component;
  // 受け取ったプロパティをそのまま渡すので、中では型を広げて描く
  const Inner: ComponentType<Record<string, unknown>> = Component;

  function WithDesign(
    props: Record<string, unknown> & { design?: DefaultDesign<C> },
  ) {
    return (
      <Inner
        {...props}
        design={mergeDesign(designDefinition, props.design, design)}
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
