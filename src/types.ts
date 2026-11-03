/**
 * 選択肢
 *
 * 部品の `value`（またはその配列の要素）に入る候補。値と操作の契約の `options` の要素。
 * 利用者がプロパティを足してよい（例: `Option<string> & { description: string }`）。
 */
export type Option<V> = {
  /**
   * 選んだときに `value` に入る値
   */
  value: V;

  /**
   * 表示する文字。省略すると `String(value)`
   */
  label?: string;

  /**
   * この選択肢だけ選べなくする
   */
  disabled?: boolean;
};

/**
 * 選択肢外の値（`value` に入っているが `options` に無い値）を表示する位置
 *
 * - `'hidden'`: 表示しない。値は消さずに残す
 * - `'start'`: 選択肢の前に表示する
 * - `'end'`: 選択肢の後に表示する
 */
export type UnlistedPlacement = 'hidden' | 'start' | 'end';

/**
 * 表示する選択肢
 *
 * 受け取った選択肢に選択肢外の値を足し、`label` を埋めたもの。
 */
export type DisplayOption<V> = Option<V> & {
  /**
   * 表示する文字（`label` を省略した場合は `String(value)`）
   */
  label: string;

  /**
   * 選択肢外の値か
   */
  unlisted: boolean;
};

/**
 * 表示の部品の主な値
 *
 * 部品が表示する値。表示の部品は値を変えないので、制御・非制御や変更の通知を持たない。
 */
export type ValueProps<T> = {
  /**
   * 表示する値
   */
  value: T;
};

/**
 * 入力の部品の主な値（制御・非制御の状態）
 *
 * `value` が `undefined` 以外なら制御、`undefined` なら `defaultValue` を初期値にした非制御。
 *
 * @template T 受け取る値の型
 * @template TChanged 通知する値の型。配列の値で、受け取りは `readonly V[]`、通知は `V[]` にする場合などに指定する
 */
export type EditableValueProps<T, TChanged extends T = T> = {
  /**
   * 値（制御）
   */
  value?: T;

  /**
   * 値の初期値（非制御）
   */
  defaultValue?: T;

  /**
   * 値が確定したときに呼ぶ関数（入力欄は blur・Enter などの確定した時点、選ぶ部品は変わった時点）
   */
  onValueChange?: (value: TChanged) => void;
};

/**
 * 開閉の状態
 *
 * `open` が `undefined` 以外なら制御、`undefined` なら `defaultOpen` を初期値にした非制御。
 */
export type OpenProps = {
  /**
   * 開いているか（制御）
   */
  open?: boolean;

  /**
   * 開いているかの初期値（非制御）
   */
  defaultOpen?: boolean;

  /**
   * 開閉が変わったときに呼ぶ関数
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * 入力欄の文字列の通知
 *
 * 自由入力と選択の両方ができる部品（コンボボックス・タグの入力など）で、入力中の文字列を親が使うためのもの。
 */
export type InputValueChangeProps = {
  /**
   * 入力欄の文字列が変わったときに呼ぶ関数
   */
  onInputValueChange?: (text: string) => void;
};

/**
 * 主な操作の通知
 *
 * 主な操作は、状態を変えずに、その部品が何かを実行するための操作（ボタンを押す、メニューの項目を選ぶ、など）。
 *
 * @template V 部品（集まりの部品では操作された項目）がプロパティで受け取った `value` の型
 */
export type MainActionProps<V> = {
  /**
   * 主な操作をしたときに呼ぶ関数。操作された部品の `value` をそのまま渡す
   */
  onMainAction?: (value: V) => void;
};

/**
 * 操作できなくする設定（HTML の `disabled` と同じ意味）
 */
export type DisabledProps = {
  /**
   * 操作できず、フォーカスも受けない
   */
  disabled?: boolean;
};

/**
 * 値を変えられなくする設定（HTML の `readonly` と同じ意味）
 */
export type ReadOnlyProps = {
  /**
   * 値は変えられないが、フォーカス・選択はできる
   */
  readOnly?: boolean;
};

/**
 * 必須であることを示す設定（HTML の `required` と同じ意味）
 *
 * 表示と支援技術のためのもの。必須の検査は、部品ではなく検証の側（state-model の規則など）で行う。
 */
export type RequiredProps = {
  /**
   * 必須であることを示す
   */
  required?: boolean;
};

/**
 * 値が正しくないことを示す設定（`aria-invalid` と同じ意味）
 */
export type InvalidProps = {
  /**
   * 不正な状態として見せる
   */
  invalid?: boolean;
};

/**
 * 選択肢
 */
export type OptionsProps<V> = {
  /**
   * 選択肢
   */
  options: readonly Option<V>[];
};

/**
 * 選択肢外の値を表示する位置
 *
 * `options` を持つ部品（入力・表示）で使う。
 */
export type UnlistedPlacementProps = {
  /**
   * 選択肢外の値を表示する位置。省略すると `'end'`
   */
  unlistedPlacement?: UnlistedPlacement;
};

/**
 * 選ばなくなった選択肢外の値を残すか
 *
 * `options` を持ち、値を外す操作がある入力の部品で使う。
 */
export type KeepUnlistedProps = {
  /**
   * 選ばなくなった選択肢外の値も、選択肢として残す
   *
   * 残すのは、マウントしている間に `value` に現れた選択肢外の値（現れた順）。
   */
  keepUnlisted?: boolean;
};

/**
 * すべて選ぶでの選択肢外の値の扱いを決めるプロパティ
 *
 * `options` を持ち、すべて選ぶを持つ部品で使う。
 */
export type SelectAllUnlistedProps = {
  /**
   * すべて選ぶ・すべて外すの対象に、選択肢外の値も含める
   */
  selectAllIncludesUnlisted?: boolean;
};
