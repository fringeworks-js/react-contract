# @fringeworks/react-contract

`@fringeworks/react-contract` は、React のコンポーネントを差し替えられるようにするための、共通のプロパティの型と道具を集めた、誰かにとっては便利なライブラリです。

**[English README is available here](./README.md)**

部品の種類や実装をまたいで共通にするプロパティの約束（名前・型・意味）と、その約束に沿った部品ならどれにも使える道具を提供します。約束に沿った部品どうしは差し替えられ、1つの部品で覚えた使い方をほかの部品でもそのまま使えます。

## インストール

```bash
npm install @fringeworks/react-contract
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

| 名前                                                              | 説明                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `useDisplayOptions(options, value, props?)`                       | 選んだ値に合わせて、表示する選択肢を作る                             |
| `createDisplayOptions(options, unlistedValues, placement?)`       | 表示する選択肢を作る（React を使わない版）                           |
| `createSelectedOptions(options, value, placement?)`               | 選んだ値の表示する選択肢を作る（選んだ値を表示する部品のためのもの） |
| `createDesignStyle(prefix, definition, design?, fallbackDesign?)` | デザインの値を、部品の CSS 変数の `style` にする                     |
| `mergeDesign(definition, design?, fallbackDesign?)`               | 2つのデザインの値を重ねる                                            |
| `createEffectiveDesign(definition, options)`                      | 部品が受け取ったデザインの値を重ねて、部品に効くデザインの値を作る   |
| `withDesign(Component, design)`                                   | アプリで共通のデザインの値を決めた部品を作る HOC                     |
| `createDesign(definition, template, options)`                     | メインの色などと割り当てから、デザインの値を作る                     |

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

### `createSelectedOptions`

```ts
createSelectedOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  placement?: UnlistedPlacement,
): DisplayOption<V>[]
```

選んだ値の表示する選択肢を、入力の部品で表示する順に並べて作ります。選んだ値のラベルを並べる部品など、選んだ値を表示する部品で使います（react-primitives の `OptionLabel`・`OptionLabels` はこれで作っています）。

```tsx
const selected = createSelectedOptions(options, value, unlistedPlacement);

<ul>
  {selected.map((option) => (
    <li key={String(option.value)}>{option.label}</li>
  ))}
</ul>;
```

- 入力の部品と同じく `createDisplayOptions` で作るので、対になる入力の部品と同じ `options`・`value`・`unlistedPlacement` を渡せば、同じ順に並び、同じ選択肢外の値が出ます。
- 選択肢の順に並べます（選んだ順ではありません）。選択肢外の値は `placement` の位置に置き、`'hidden'` なら出しません。`placement` を省略すると `'end'` です。
- 単独の値は `[value]` のように配列にして渡します。値は `Object.is` で比べます。

### `createDesignStyle`

```ts
createDesignStyle<D extends DesignDefinition>(
  prefix: string,
  definition: D,
  design?: Design<D>,
  fallbackDesign?: Design<D>,
): DesignStyle
```

部品のデザインの値を、CSS 変数の `style` にします。部品が `design` などのプロパティでデザインの値を受け取り、要素の `style` に重ねるために使います。

```ts
const definition = {
  properties: { gap: [], opacity: ['disabled'] },
  parts: {
    label: { color: [] },
    indicator: { size: [], backgroundColor: ['checked'] },
  },
} as const satisfies DesignDefinition;

createDesignStyle('frg-checkbox', definition, {
  gap: 8,
  indicator: {
    backgroundColor: { base: '#fff', checked: 'var(--brand-accent)' },
  },
});
// → {
//   '--frg-checkbox-gap': '8px',
//   '--frg-checkbox-indicator-backgroundColor': '#fff',
//   '--frg-checkbox-indicator-backgroundColor-checked': 'var(--brand-accent)',
// }
```

| 引数              | 型          | 説明                                                                                                             |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `prefix`          | `string`    | CSS 変数の名前の、部分より前（`frg-checkbox` など。`--` は付けない）                                             |
| `definition`      | `D`         | 部品のデザインの定義（受け付けるプロパティと、効く状態）                                                         |
| `design?`         | `Design<D>` | デザインの値                                                                                                     |
| `fallbackDesign?` | `Design<D>` | `design` で指定していないプロパティ・状態を補う値。部品のプロパティも重ねるときは `createEffectiveDesign` を使う |

デザインの値は、次の3つの軸で書きます。どの部品でも同じ書き方です。

| 軸         | 書き方                                                                                                                                             | 例                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| プロパティ | CSS のプロパティ名の camelCase（React の `style` と同じ）。略記は `size`（`width` と `height`）・`paddingX`・`paddingY`・`marginX`・`marginY` だけ | `color`・`backgroundColor`・`borderRadius`・`opacity` |
| 部分       | ルートのプロパティは直接、部分のプロパティは部分の名前の下に書く                                                                                   | `label: { color }`・`indicator: { size }`             |
| 状態       | 1つの値か、状態ごとのオブジェクト（`{ base, hover, … }`）                                                                                          | `backgroundColor: { base: '#fff', checked: 'green' }` |

- CSS 変数の名前は `--<prefix>[-<部分>]-<プロパティ>[-<状態>]` です。定義にあるプロパティだけを書き、指定していないもの（値が `undefined` のものを含む）は書きません。
- 1つの値は、そのプロパティで効くすべての状態の変数に書きます（`'red'` なら `-checked` なども `red`）。状態ごとのオブジェクトは、書いた状態の変数だけを書きます。省略した状態は、部品の CSS の既定の値のままです（`base` の値を引き継ぎません）。
- 状態は `hover`・`focus`（`:focus-visible`）・`active`・`open`・`checked`・`indeterminate`・`readOnly`・`invalid`・`disabled` です。重なったときは、この順で後のものが勝ちます。
- 例外として、CSS のプロパティが無い可変フォントの軸に `filled`（塗り。0〜1）・`grade`（グレード）・`opticalSize`（光学サイズ）の名前を使います（アイコンのフォントの Material Symbols など）。
- 長さの数値には px を、`rotate`（回す角度）の数値には deg を付け、`opacity`・`fontWeight`・`lineHeight`・`filled`・`grade`・`opticalSize`・`scale`（倍率）・`strokeWidth`（SVG の線の太さ。SVG の座標の単位）の数値は単位なしで書きます。どの値にも `var(--…)` の文字列を渡せるので、テーマの仕組みの CSS 変数につなげます。

### `mergeDesign`

```ts
mergeDesign<D extends DesignDefinition>(
  definition: D,
  design?: Design<D>,
  fallbackDesign?: Design<D>,
): Design<D>
```

2つのデザインの値を重ねます。`design` で指定していないプロパティ・状態を、`fallbackDesign` の値で補います（`createDesignStyle` の `fallbackDesign` と同じ規則）。`design` の1つの値は `fallbackDesign` の値をすべての状態で上書きし、状態ごとのオブジェクトは省略した状態を `fallbackDesign` で補います。

```ts
mergeDesign(
  definition,
  { indicator: { backgroundColor: { base: 'blue' } } },
  {
    gap: 4,
    indicator: { backgroundColor: { base: 'red', checked: 'pink' } },
  },
);
// → { gap: 4, indicator: { backgroundColor: { base: 'blue', checked: 'pink' } } }
```

### `createEffectiveDesign`

```ts
createEffectiveDesign<D extends DesignDefinition>(
  definition: D,
  options: CreateEffectiveDesignOptions<D>,
): Design<D>
```

部品が受け取った、強さの違うデザインの値を重ねて、部品に効くデザインの値を作ります。部品は受け取ったものをそのまま渡せばよく、重ねる順を知らなくて済みます。結果は `createDesignStyle` に渡します。

| オプション        | 型          | 説明                                                                                                                                        |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `design?`         | `Design<D>` | 使う場所で渡したデザインの値（部品の `design` プロパティ）。いちばん強い                                                                    |
| `propsDesign?`    | `Design<D>` | 部品のプロパティのうち、デザインの値と同じことをするもの（react-icon-material-symbols の `fontWeight` など）から作った値。1つの値として書く |
| `fallbackDesign?` | `Design<D>` | アプリで共通のデザインの値（部品の `fallbackDesign` プロパティ。`withDesign` が渡す）。いちばん弱い                                         |

`design` ＞ `propsDesign` ＞ `fallbackDesign` の順に重ね、強い方で指定していないプロパティ・状態を弱い方の値で補います（重ね方は `mergeDesign`）。

- 手間をかけて書いた方を優先します。プロパティ（`fontWeight={300}`）より、`design` の状態ごとの値（`{ fontWeight: { hover: 700 } }`）が強くなります。
- 層が違うときは、使う場所に近い方を優先します。アプリで共通の値は、使う場所のプロパティより弱くなります。
- `propsDesign` の値が `undefined` のプロパティは、指定しなかったものとして扱います。

```ts
createEffectiveDesign(definition, {
  design: { fontWeight: { hover: 700 } },
  propsDesign: { fontWeight: 300 },
  fallbackDesign: { fontWeight: 500, filled: 1 },
});
// → { fontWeight: { base: 300, hover: 700 }, filled: 1 }
```

部品では、次のように使います。

```tsx
function Box({ design, fallbackDesign, gap, ...props }: BoxProps) {
  return (
    <div
      {...props}
      style={createDesignStyle(
        'my-box',
        boxDesignDefinition,
        createEffectiveDesign(boxDesignDefinition, {
          design,
          propsDesign: { gap },
          fallbackDesign,
        }),
      )}
    />
  );
}
Box.designDefinition = boxDesignDefinition;
```

### `withDesign`

```ts
withDesign<C extends DesignableComponent>(Component: C, design: FallbackDesign<C>): C
```

アプリで共通のデザインの値を決めた部品を作ります。この関数に渡した値は、部品の `fallbackDesign` プロパティで渡します。使う場所で渡した `design` には混ぜないので、部品は `createEffectiveDesign` で、使う場所の値をアプリで共通の値より優先できます。アプリで1回作り、画面ではそのまま置きます。

```tsx
// アプリで1回だけ作る
export const AppCheckbox = withDesign(Checkbox, {
  indicator: { backgroundColor: { checked: 'var(--brand-accent)' } },
});

// 画面ではそのまま置く。使う場所の design は、アプリで共通の値より優先する
<AppCheckbox design={{ gap: 4 }}>同意する</AppCheckbox>;
```

- 包む部品は、`design`・`fallbackDesign` プロパティでデザインの値を受け取り（`createEffectiveDesign` で重ねる）、静的なプロパティ `designDefinition` にデザインの定義を持つものです（`@fringeworks/react-components` の部品はどれも持っています）。自作の部品も、`designDefinition` を付ければ包めます。
- 重ねて使えます。使う場所で渡した `fallbackDesign` > 外側の `withDesign` > 内側の `withDesign` の順に優先し、まとめて `fallbackDesign` で渡します。部品の中では、使う場所の `design` > 部品のプロパティ > `fallbackDesign` > 部品の CSS の既定の値の順になります。
- 作ったコンポーネントは、包んだ部品と同じ型で返します。ジェネリックな部品（`Table` など）の型引数も残ります。`designDefinition` も引き継ぎます。
- Context は使わず、作ったコンポーネントの中で値を重ねます。どの値が効いているかは、コードからたどれます。

### `createDesign`

```ts
createDesign<D extends DesignDefinition, const O extends CreateDesignOptions>(
  definition: D,
  template: DesignTemplate<D, …>,
  options: O,
): Design<D>
```

メインの色・角の丸みなどの入力（`options`）と、どのデザインの値にどの色を入れるかの割り当て（`template`）から、部品に渡すデザインの値を作ります。1つ1つのデザインの値を決めなくても、基準になる色を渡すだけで見栄えのする値を作れるようにするためのものです。割り当てはデータ（JSON にできる値）で書けるので、デザイナーが決めた色の使い方をそのまま反映できます。

`@fringeworks/react-components` の部品には、既定の割り当てでこの関数を呼ぶ `create<部品名>Design`（`createCheckboxDesign` など）があります。

```ts
createDesign(
  checkboxDesignDefinition,
  {
    indicator: {
      backgroundColor: { checked: 'primaryColor' },
      borderColor: {
        checked: {
          from: 'primaryColor',
          ensureContrast: { against: '#ffffff', ratio: 3 },
        },
      },
      color: {
        checked: [
          'primaryContrastColor',
          { readableOn: 'primaryColor', minRatio: 3 },
        ],
      },
    },
  },
  { primaryColor: '#0a7d5a' },
);
// → { indicator: { backgroundColor: { checked: '#0a7d5a' }, borderColor: { checked: '#0a7d5a' }, color: { checked: '#ffffff' } } }
```

| 引数         | 型                    | 説明                                                                         |
| ------------ | --------------------- | ---------------------------------------------------------------------------- |
| `definition` | `D`                   | 部品のデザインの定義                                                         |
| `template`   | `DesignTemplate<D>`   | デザインの割り当て。デザインの値と同じ形で、値の所に色・長さを作る指定を書く |
| `options`    | `CreateDesignOptions` | デザインの元になる値（下記）                                                 |

入力のキーは、基本は次のキー（テーマの色の役割の名前）を使います。どれも省略できます。当てはまらないものは、任意のキーで渡してかまいません（割り当てからそのキーを指せます）。

| キー                    | 説明                                                                                                                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primaryColor?`         | メインの色。チェックした印・フォーカスの線など、強調する部分に使う                                                                                                                                                            |
| `primaryContrastColor?` | メインの色の上に置く文字・印の色。部品の既定の割り当てでは、省略すると白か黒を自動で選ぶ                                                                                                                                      |
| `errorColor?`           | エラーの色。`invalid` のときの枠などに使う                                                                                                                                                                                    |
| `neutralColor?`         | 灰色の系統の基準の色（枠・控えめな文字など）。ブランドの色味を帯びた灰色でもよい                                                                                                                                              |
| `radius?`               | 角の丸みの基準（`number \| CSS の長さ`）。ボタン・入力欄などはこの値、チェックボックスの印などはこれを元に小さくした値にする。数値は px。`'0.5rem'`・`var(--app-radius)` も渡せる。大きな値（`9999`）でボタンをピル型にできる |
| `scaling?`              | 部品の中の余白・間隔・大きさの倍率（詰め具合）。`1` が部品の既定。`0.9` で詰め、`1.1` でゆったりさせる                                                                                                                        |

割り当ての値は、プロパティの種類によって書き方が違います。どちらも、関数以外の書き方（`DesignColorSpec`・`DesignLengthSpec`）は JSON にできるデータです。

色のプロパティ（`color`・`backgroundColor`・`borderColor`・`outlineColor`）には、色を作る指定を書きます。変換には `@fringeworks/design-utils` の色の関数を使います。

| 書き方                                                            | 意味                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `'primaryColor'`                                                  | 入力の色をそのまま使う                                                                                        |
| `{ from, adjust?, mix?, ensureContrast?, alpha? }`                | 入力の色を変換する（`adjustColor`・`mixColors`・`ensureContrast`・`changeAlpha`）。書いた変換を、この順に行う |
| `{ readableOn, candidates?, minRatio? }`                          | その色の上で読みやすい色を、候補（既定は白と黒）から選ぶ（`chooseReadableColor`）                             |
| 配列                                                              | 先頭から順に試し、最初に色が決まったものを使う（任意の入力の色を、ほかの指定で補うときなど）                  |
| 関数（`DesignColorFunction`。`(options) => string \| undefined`） | 入力を受け取って色を返す（データで書けないもの）。配列の中には書けない                                        |

長さのプロパティ（`borderRadius`・`borderWidth`・`gap`・`paddingX`・`paddingY`・`marginX`・`marginY`・`size`・`width`・`height`）には、長さを作る指定を書きます。

| 書き方                                                                       | 意味                                                           |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `'radius'`                                                                   | 入力の値をそのまま使う（数値は px）                            |
| `{ from, scale?, min?, max? }`                                               | 元の長さ（`from`）に `scale` を掛け、`min`・`max` の間に収める |
| 配列                                                                         | 先頭から順に試し、最初に値が決まったものを使う                 |
| 関数（`DesignLengthFunction`。`(options) => string \| number \| undefined`） | 入力を受け取って長さを返す（数値は px）。配列の中には書けない  |

```ts
{
  // 印の角の丸みは radius の半分。0.3em より丸くしない
  indicator: { borderRadius: { from: 'radius', scale: 0.5, max: '0.3em' } },
  // 部品の既定の間隔（6px）に、詰め具合を掛ける
  gap: { from: '6px', scale: 'scaling' },
}
// { radius: 8, scaling: 0.9 } → { indicator: { borderRadius: 'min(4px, 0.3em)' }, gap: '5.4px' }
// { radius: 'var(--app-radius)' } → { indicator: { borderRadius: 'min(calc(var(--app-radius) * 0.5), 0.3em)' } }
```

- `from`・`min`・`max` には、入力のキーのほかに、数値（px）と CSS の長さ（`'6px'`・`'0.3em'`・`var(--…)` など）を書けます。`scale` には、数値か、数値を渡す入力のキーを書けます。
- 数値どうし・数値と単位だけの長さは計算した値にし（`8 * 0.5` → `4`、`'0.875em' * 0.9` → `'0.788em'`）、`var()` などを含む長さは `calc()`・`min()`・`max()`・`clamp()` の文字列にします。そのため、テーマの CSS 変数も基準にできます。
- `min` が `max` より大きいときは、`min` を優先します（CSS の `clamp()` と同じ）。
- 色の `mix.with`・`ensureContrast.against`・`candidates` には、入力のキーのほかに具体的な色（`'#ffffff'` など）も書けます。
- 値が決まらないもの（入力に無いキー・読めない色）は作りません。割り当てに書かなかったプロパティ・状態も、デザインの値に入りません。どちらも部品の既定の見た目のままです。そのため、一部の値だけを渡すこともできます。
- 割り当てに状態を付けない1つの値を書くと、デザインの値の規則どおり、すべての状態に効きます。
- 今は色と長さのプロパティだけを受け付けます（`opacity`・`fontWeight` などは受け付けません）。定義に無いプロパティ・状態、入力に無いキー、プロパティの種類に合わない指定（長さのプロパティに色の指定など）を書くと型エラーになります。

### 型

| 型                                | 説明                                                                                                                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Option<V>`                       | 選択肢（`value`・`label?`・`disabled?`）。プロパティを足してよい                                                                                                                                               |
| `DisplayOption<V>`                | 表示する選択肢（`Option<V>` に、必ず入る `label` と、選択肢外の値かを表す `unlisted` を足したもの）                                                                                                            |
| `UnlistedPlacement`               | 選択肢外の値を表示する位置（`'hidden'`・`'start'`・`'end'`）                                                                                                                                                   |
| `ValueProps<T>`                   | 表示の部品の主な値                                                                                                                                                                                             |
| `EditableValueProps<T, TChanged>` | 入力の部品の主な値（制御・非制御の状態）                                                                                                                                                                       |
| `OpenProps`                       | 開閉の状態                                                                                                                                                                                                     |
| `InputValueChangeProps`           | 入力欄の文字列の通知                                                                                                                                                                                           |
| `MainActionProps<V>`              | 主な操作の通知                                                                                                                                                                                                 |
| `DisabledProps`                   | 操作できなくする設定                                                                                                                                                                                           |
| `ReadOnlyProps`                   | 値を変えられなくする設定                                                                                                                                                                                       |
| `RequiredProps`                   | 必須であることを示す設定                                                                                                                                                                                       |
| `InvalidProps`                    | 値が正しくないことを示す設定                                                                                                                                                                                   |
| `OptionsProps<V>`                 | 選択肢                                                                                                                                                                                                         |
| `UnlistedPlacementProps`          | 選択肢外の値を表示する位置（`unlistedPlacement`）                                                                                                                                                              |
| `KeepUnlistedProps`               | 選ばなくなった選択肢外の値を残すか（`keepUnlisted`）                                                                                                                                                           |
| `SelectAllUnlistedProps`          | すべて選ぶでの選択肢外の値の扱いを決めるプロパティ（`selectAllIncludesUnlisted`）                                                                                                                              |
| `IconSlotProps<V>`                | アイコンの口に組み込む部品が受け取る props（`value` と、`<span>`・`<svg>` のどちらにも渡せる `className`・`style`・`id`・`title`・`role`・`aria-hidden`・`aria-label`・`aria-labelledby`・`aria-describedby`） |
| `IconComponent<V>`                | アイコンの口に組み込める部品（`IconSlotProps<V>` を受け取る部品）。`V` を省略すると、どの名前の型の部品も代入できる                                                                                            |
| `UseDisplayOptionsResult<V>`      | `useDisplayOptions` の戻り値                                                                                                                                                                                   |
| `DesignDefinition`                | 部品のデザインの定義（ルートと部分ごとの、受け付けるプロパティと効く状態）                                                                                                                                     |
| `DesignPartDefinition`            | ルートまたは部分の、受け付けるプロパティと効く状態                                                                                                                                                             |
| `Design<D>`                       | 部品に渡すデザインの値（定義から作る）                                                                                                                                                                         |
| `DesignValue<T, S>`               | デザインの値（1つの値か、状態ごとのオブジェクト）                                                                                                                                                              |
| `DesignState`                     | デザインの値を分ける状態                                                                                                                                                                                       |
| `DesignProperty`                  | デザインのプロパティの名前                                                                                                                                                                                     |
| `DesignPropertyValues`            | デザインのプロパティと、受け付ける値の型                                                                                                                                                                       |
| `DesignStyle`                     | `createDesignStyle` が作る CSS 変数の `style`                                                                                                                                                                  |
| `DesignableComponent<D>`          | `withDesign` で包める部品（`design`・`fallbackDesign` を受け取り、`designDefinition` を持つもの）                                                                                                              |
| `FallbackDesign<C>`               | `withDesign` に渡す、アプリで共通のデザインの値                                                                                                                                                                |
| `CreateEffectiveDesignOptions<D>` | `createEffectiveDesign` のオプション                                                                                                                                                                           |
| `CreateDesignOptions`             | `createDesign` に渡す、デザインの元になる値                                                                                                                                                                    |
| `DesignTemplate<D, O>`            | デザインの割り当て（デザインの値と同じ形で、値の所に色・長さを作る指定を書いたもの）                                                                                                                           |
| `DesignColorSpec<K>`              | 色を作る指定（JSON にできるデータ）                                                                                                                                                                            |
| `DesignColorFunction<O>`          | 入力を受け取って色を返す関数（割り当ての値に書く）                                                                                                                                                             |
| `DesignColorKey<O>`               | 入力のキーのうち、色を渡すもの                                                                                                                                                                                 |
| `DesignColorProperty`             | 色の値を受け付けるデザインのプロパティ                                                                                                                                                                         |
| `DesignLengthSpec<K>`             | 長さを作る指定（JSON にできるデータ）                                                                                                                                                                          |
| `DesignLengthFunction<O>`         | 入力を受け取って長さを返す関数（割り当ての値に書く）                                                                                                                                                           |
| `DesignLengthKey<O>`              | 入力のキーのうち、長さや倍率を渡すもの                                                                                                                                                                         |
| `DesignLengthProperty`            | 長さの値を受け付けるデザインのプロパティ                                                                                                                                                                       |
| `AdjustColorOptions`              | `DesignColorSpec` の `adjust` に書く、色の調整の指定（`@fringeworks/design-utils` の型）                                                                                                                       |
| `AbsoluteColor`                   | `CreateDesignOptions` の色に渡す具体的な色（`HexColor \| FunctionalColor \| NamedColor`。`@fringeworks/types` の型）                                                                                           |
| `HexColor`                        | 16進数の色（`#${string}`。`@fringeworks/types` の型）                                                                                                                                                          |
| `FunctionalColor`                 | `rgb()`・`hsl()`・`oklch()` などの色の関数で書いた色（`@fringeworks/types` の型）                                                                                                                              |
| `NamedColor`                      | CSS の色の名前（148 個の名前と `transparent`。`@fringeworks/types` の型）                                                                                                                                      |

## ライセンス

MIT
