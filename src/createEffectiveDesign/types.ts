import type { Design, DesignDefinition } from '../createDesignStyle';

/**
 * createEffectiveDesign のオプション
 *
 * 部品が受け取った、強さの違うデザインの値。どれも省略できる。
 *
 * @template D 部品のデザインの定義
 */
export type CreateEffectiveDesignOptions<D extends DesignDefinition> = {
  /**
   * 使う場所で渡したデザインの値（部品の `design` プロパティ）。いちばん強い
   */
  design?: Design<D>;
  /**
   * 部品のプロパティのうち、デザインの値と同じことをするもの（react-icon-material-symbols の `fontWeight` など）から作ったデザインの値。
   * プロパティは1つの値として書く（すべての状態に効く）。値が `undefined` のプロパティは、指定しなかったものとして扱う
   */
  propsDesign?: Design<D>;
  /**
   * アプリで共通のデザインの値（部品の `fallbackDesign` プロパティ。`withDesign` が渡す）。いちばん弱い
   */
  fallbackDesign?: Design<D>;
};
