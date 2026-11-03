# @fringeworks/react-contract

`@fringeworks/react-contract` は、React のコンポーネントを差し替えられるようにするための、共通のプロパティの型と道具を集めた、誰かにとっては便利なライブラリです。

**[English README is available here](./README.md)**

## インストール

```bash
npm install @fringeworks/react-contract
# または
pnpm add @fringeworks/react-contract
```

React 18 と 19 に対応しています。

## 値と操作の契約

部品が受け取るプロパティの名前・型・意味（いつ何を通知するか）を、部品の種類をまたいでそろえる約束です。この約束に沿った部品どうしは、`value` の型が合えば差し替えられます。

| 分類   | 名前                                          | 型                                                                | 意味                                                                     |
| ------ | --------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 状態   | `value` / `defaultValue` / `onValueChange`    | `EditableValueProps<T, TChanged?>`                                | 入力の部品の主な値。`onValueChange` は値が確定したときに呼ぶ             |
| 値     | `value`                                       | `ValueProps<T>`                                                   | 表示の部品の主な値（省略できない）                                       |
| 状態   | `open` / `defaultOpen` / `onOpenChange`       | `OpenProps`                                                       | 開閉                                                                     |
| 通知   | `onInputValueChange(text)`                    | `InputValueChangeProps`                                           | 入力欄の文字列が変わった（自由入力と選択の両方ができる部品で使う）       |
| 通知   | `onMainAction(value)`                         | `MainActionProps<V>`                                              | 主な操作。操作された部品がプロパティで受け取った `value` を渡す          |
| 設定   | `disabled`・`readOnly`・`required`・`invalid` | `DisabledProps`・`ReadOnlyProps`・`RequiredProps`・`InvalidProps` | 名前と意味は HTML に合わせる（`invalid` は `aria-invalid`）              |
| データ | `options`                                     | `OptionsProps<V>`                                                 | 選択肢（`Option<V>`）                                                    |
| 設定   | `unlistedPlacement`                           | `UnlistedPlacementProps`                                          | 選択肢外の値（`value` に入っているが `options` に無い値）を表示する位置  |
| 設定   | `keepUnlisted`                                | `KeepUnlistedProps`                                               | 選ばなくなった選択肢外の値を残すか（値を外す操作がある入力の部品で使う） |
| 設定   | `selectAllIncludesUnlisted`                   | `SelectAllUnlistedProps`                                          | すべて選ぶでの選択肢外の値の扱い（すべて選ぶを持つ部品で使う）           |

- 状態は、制御（`value`）と非制御（`defaultValue`）のどちらでも受け付けます。`value` が `undefined` 以外なら制御です。制御・非制御を扱う hook は、[`@fringeworks/react-utils`](https://github.com/fringeworks-js/react-utils) の `useControllableState` です。
- 契約に沿った部品は [`@fringeworks/react-primitives`](https://github.com/fringeworks-js/react-primitives)（見た目の無い材料）と [`@fringeworks/react-components`](https://github.com/fringeworks-js/react-components)（見た目を付けた部品）にあります。

### 部品のプロパティの型の作り方

部品のプロパティの型は、上の型を組み合わせて作ります。部品は、意味のある設定だけを受け付けます（ボタンは `readOnly` を受け付けない、など）。

```ts
import type {
  DisabledProps,
  EditableValueProps,
  InvalidProps,
  OptionsProps,
  ReadOnlyProps,
} from '@fringeworks/react-contract';

// 複数の値を選ぶ部品。受け取りは readonly V[]、通知は V[]（useState の setter をそのまま渡せる）
type MultiSelectProps<V> = OptionsProps<V> &
  EditableValueProps<readonly V[], V[]> &
  DisabledProps &
  ReadOnlyProps &
  InvalidProps;
```

- 型は「一緒にしか使わないものは1つの型、部品ごとに選ぶものは別の型」に分けています。状態の3つ（`value` / `defaultValue` / `onValueChange`）は1つの型、設定は1つずつの型です。
- `EditableValueProps` の2つ目の型の引数は、通知する値の型です。省略すると、受け取る値の型と同じです。

## API

| 名前                                                        | 説明                                       |
| ----------------------------------------------------------- | ------------------------------------------ |
| `useDisplayOptions(options, value, props?)`                 | 選んだ値に合わせて、表示する選択肢を作る   |
| `createDisplayOptions(options, unlistedValues, placement?)` | 表示する選択肢を作る（React を使わない版） |

### `useDisplayOptions`

```ts
useDisplayOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  props?: UnlistedPlacementProps & KeepUnlistedProps,
): UseDisplayOptionsResult<V>
```

選んだ値に合わせて、表示する選択肢を作ります。`options` を持つ部品で、選択肢外の値（`value` に入っているが `options` に無い値）の扱いをそろえるために使います。

```ts
const { displayOptions, unlistedValues } = useDisplayOptions(
  props.options,
  value,
  props, // unlistedPlacement・keepUnlisted を部品のプロパティからそのまま渡せる
);
```

| 引数      | 型                                           | 説明                                                          |
| --------- | -------------------------------------------- | ------------------------------------------------------------- |
| `options` | `readonly Option<V>[]`                       | 選択肢                                                        |
| `value`   | `readonly V[]`                               | 選んだ値（単独の値の部品は `[value]` のように配列にして渡す） |
| `props?`  | `UnlistedPlacementProps & KeepUnlistedProps` | 選択肢外の値の扱い（`unlistedPlacement`・`keepUnlisted`）     |

| 戻り値           | 型                   | 説明                                                                                                      |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `displayOptions` | `DisplayOption<V>[]` | 表示する選択肢。`label` を埋め、選択肢外の値を `unlistedPlacement` の位置に足したもの                     |
| `unlistedValues` | `V[]`                | 選択肢外の値。`keepUnlisted` のときは選ばなくなったものも含む。`unlistedPlacement` が `'hidden'` でも返す |

- `keepUnlisted` のときは、マウントしている間に `value` に現れた選択肢外の値を、`value` から消えた後も返し続けます（現れた順）。後から `options` に入った値は、選択肢外として扱いません。
- 値は `Object.is` で比べます。
- 選択肢外の値の `label` は `String(value)` です。

### `createDisplayOptions`

```ts
createDisplayOptions<V>(
  options: readonly Option<V>[],
  unlistedValues: readonly V[],
  placement?: UnlistedPlacement,
): DisplayOption<V>[]
```

表示する選択肢を作ります。`useDisplayOptions` の中で使っているもので、React を使わずに同じ形の選択肢を作りたいときに使います。`placement` を省略すると `'end'` です。

### 型

| 型                                | 説明                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Option<V>`                       | 選択肢（`value`・`label?`・`disabled?`）。プロパティを足してよい                                    |
| `DisplayOption<V>`                | 表示する選択肢（`Option<V>` に、必ず入る `label` と、選択肢外の値かを表す `unlisted` を足したもの） |
| `UnlistedPlacement`               | 選択肢外の値を表示する位置（`'hidden'`・`'start'`・`'end'`）                                        |
| `ValueProps<T>`                   | 表示の部品の主な値                                                                                  |
| `EditableValueProps<T, TChanged>` | 入力の部品の主な値（制御・非制御の状態）                                                            |
| `OpenProps`                       | 開閉の状態                                                                                          |
| `InputValueChangeProps`           | 入力欄の文字列の通知                                                                                |
| `MainActionProps<V>`              | 主な操作の通知                                                                                      |
| `DisabledProps`                   | 操作できなくする設定                                                                                |
| `ReadOnlyProps`                   | 値を変えられなくする設定                                                                            |
| `RequiredProps`                   | 必須であることを示す設定                                                                            |
| `InvalidProps`                    | 値が正しくないことを示す設定                                                                        |
| `OptionsProps<V>`                 | 選択肢                                                                                              |
| `UnlistedPlacementProps`          | 選択肢外の値を表示する位置（`unlistedPlacement`）                                                   |
| `KeepUnlistedProps`               | 選ばなくなった選択肢外の値を残すか（`keepUnlisted`）                                                |
| `SelectAllUnlistedProps`          | すべて選ぶでの選択肢外の値の扱いを決めるプロパティ（`selectAllIncludesUnlisted`）                   |
| `UseDisplayOptionsResult<V>`      | `useDisplayOptions` の戻り値                                                                        |

## ライセンス

MIT
