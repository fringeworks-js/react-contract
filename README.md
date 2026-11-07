# @fringeworks/react-contract

`@fringeworks/react-contract` is a library some will find handy, offering the shared prop types and helpers that make React components swappable.

**[日本語のREADMEはこちら](./README.ja.md)**

## Installation

```bash
npm install @fringeworks/react-contract
# or
pnpm add @fringeworks/react-contract
```

Supports React 18 and 19.

## The value and operation contract

An agreement that aligns the names, types, and meanings (what is notified, and when) of the props across kinds of components. Components that follow it can be swapped when their `value` types match.

| Kind    | Name                                          | Type                                                              | Meaning                                                                                                   |
| ------- | --------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| State   | `value` / `defaultValue` / `onValueChange`    | `EditableValueProps<T, TChanged?>`                                | The main value of an input component. `onValueChange` is called when the value is committed               |
| Value   | `value`                                       | `ValueProps<T>`                                                   | The main value of a display component (required)                                                          |
| State   | `open` / `defaultOpen` / `onOpenChange`       | `OpenProps`                                                       | Open or closed                                                                                            |
| Notice  | `onInputValueChange(text)`                    | `InputValueChangeProps`                                           | The text in the input changed (for components that allow both free input and selection)                   |
| Notice  | `onMainAction(value)`                         | `MainActionProps<V>`                                              | The main action. Passes the `value` the component received as a prop                                      |
| Setting | `disabled`, `readOnly`, `required`, `invalid` | `DisabledProps`, `ReadOnlyProps`, `RequiredProps`, `InvalidProps` | Names and meanings follow HTML (`invalid` follows `aria-invalid`)                                         |
| Data    | `options`                                     | `OptionsProps<V>`                                                 | The options (`Option<V>`)                                                                                 |
| Setting | `unlistedPlacement`                           | `UnlistedPlacementProps`                                          | Where to show unlisted values (values in `value` but not in `options`)                                    |
| Setting | `keepUnlisted`                                | `KeepUnlistedProps`                                               | Whether to keep unlisted values that are no longer selected (for input components that can remove values) |
| Setting | `selectAllIncludesUnlisted`                   | `SelectAllUnlistedProps`                                          | How "select all" handles unlisted values (for components with "select all")                               |

- States can be controlled (`value`) or uncontrolled (`defaultValue`). A state is controlled when `value` is not `undefined`. The hook for controlled and uncontrolled states is `useControllableState` of [`@fringeworks/react-utils`](https://github.com/fringeworks-js/react-utils).
- Components that follow the contract are in [`@fringeworks/react-primitives`](https://github.com/fringeworks-js/react-primitives) (materials without a look) and [`@fringeworks/react-components`](https://github.com/fringeworks-js/react-components) (components with a look).

### Building a component's props type

Build a component's props type by combining the types above. A component accepts only the settings that make sense for it (a button does not accept `readOnly`, for example).

```ts
import type {
  DisabledProps,
  EditableValueProps,
  InvalidProps,
  OptionsProps,
  ReadOnlyProps,
} from '@fringeworks/react-contract';

// A component that selects several values. It takes readonly V[] and notifies V[] (so a useState setter can be passed as it is)
type MultiSelectProps<V> = OptionsProps<V> &
  EditableValueProps<readonly V[], V[]> &
  DisabledProps &
  ReadOnlyProps &
  InvalidProps;
```

- The types follow this rule: things that are always used together share one type, and things each component picks get their own type. The three props of a state (`value` / `defaultValue` / `onValueChange`) are one type; each setting is its own type.
- The second type parameter of `EditableValueProps` is the type of the notified value. It defaults to the type of the received value.

## API

| Name                                                             | Description                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useDisplayOptions(options, value, props?)`                      | Creates the options to show for the selected values                                                    |
| `createDisplayOptions(options, unlistedValues, placement?)`      | Creates the options to show (without React)                                                            |
| `createSelectedOptions(options, value, placement?)`              | Creates the options to show for the selected values only (for components that display selected values) |
| `createDesignStyle(prefix, definition, design?, defaultDesign?)` | Turns design values into a `style` of the component's CSS variables                                    |
| `mergeDesign(definition, design?, defaultDesign?)`               | Merges two design values                                                                               |
| `withDesign(Component, design)`                                  | An HOC that creates a component with default design values                                             |
| `createDesign(definition, template, options)`                    | Creates design values from inputs such as a primary color and a template                               |

### `useDisplayOptions`

```ts
useDisplayOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  props?: UnlistedPlacementProps & KeepUnlistedProps,
): UseDisplayOptionsResult<V>
```

Creates the options to show for the selected values. Use it to handle unlisted values (values in `value` but not in `options`) the same way across components with `options`.

```ts
const { displayOptions, unlistedValues } = useDisplayOptions(
  props.options,
  value,
  props, // unlistedPlacement and keepUnlisted can be passed from the component's props as they are
);
```

| Parameter | Type                                         | Description                                                            |
| --------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `options` | `readonly Option<V>[]`                       | The options                                                            |
| `value`   | `readonly V[]`                               | The selected values (for a single-value component, pass `[value]`)     |
| `props?`  | `UnlistedPlacementProps & KeepUnlistedProps` | How to handle unlisted values (`unlistedPlacement` and `keepUnlisted`) |

| Result           | Type                 | Description                                                                                                |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `displayOptions` | `DisplayOption<V>[]` | The options to show, with `label` filled and unlisted values added at `unlistedPlacement`                  |
| `unlistedValues` | `V[]`                | The unlisted values. With `keepUnlisted`, includes those no longer selected. Returned even when `'hidden'` |

- With `keepUnlisted`, it keeps returning the unlisted values that appeared in `value` while mounted, even after they leave `value` (in the order they appeared). Values that are later added to `options` are not treated as unlisted.
- Values are compared with `Object.is`.
- The `label` of an unlisted value is `String(value)`.

### `createDisplayOptions`

```ts
createDisplayOptions<V>(
  options: readonly Option<V>[],
  unlistedValues: readonly V[],
  placement?: UnlistedPlacement,
): DisplayOption<V>[]
```

Creates the options to show. `useDisplayOptions` uses it internally; use it to create the same options without React. `placement` defaults to `'end'`.

### `createSelectedOptions`

```ts
createSelectedOptions<V>(
  options: readonly Option<V>[],
  value: readonly V[],
  placement?: UnlistedPlacement,
): DisplayOption<V>[]
```

Creates the options to show for the selected values, in the order an input component shows them. Use it in components that display selected values, such as one that lists the labels of the selected values (`OptionLabel` and `OptionLabels` of react-primitives are built with it).

```tsx
const selected = createSelectedOptions(options, value, unlistedPlacement);

<ul>
  {selected.map((option) => (
    <li key={String(option.value)}>{option.label}</li>
  ))}
</ul>;
```

- It is built with `createDisplayOptions` like input components, so with the same `options`, `value`, and `unlistedPlacement` as the paired input component, the options come in the same order and the same unlisted values appear.
- The options are in the order of `options` (not the order of selection). Unlisted values are placed at `placement`, and not shown when it is `'hidden'`. `placement` defaults to `'end'`.
- Pass a single value as an array, like `[value]`. Values are compared with `Object.is`.

### `createDesignStyle`

```ts
createDesignStyle<D extends DesignDefinition>(
  prefix: string,
  definition: D,
  design?: Design<D>,
  defaultDesign?: Design<D>,
): DesignStyle
```

Turns the design values of a component into a `style` of CSS variables. A component uses it to take design values through a prop such as `design` and merge them into the `style` of its element.

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

| Parameter        | Type        | Description                                                                                      |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `prefix`         | `string`    | The part of the CSS variable names before the part name (`frg-checkbox` and so on, without `--`) |
| `definition`     | `D`         | The design definition of the component (the properties it accepts and their states)              |
| `design?`        | `Design<D>` | The design values                                                                                |
| `defaultDesign?` | `Design<D>` | Values that fill the properties and states `design` does not specify (app defaults, for example) |

Design values are written along three axes, the same way for every component.

| Axis     | How to write                                                                                                                                                         | Example                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Property | The camelCase CSS property name (the same as React `style`). The only shorthands are `size` (`width` and `height`), `paddingX`, `paddingY`, `marginX`, and `marginY` | `color`, `backgroundColor`, `borderRadius`, `opacity` |
| Part     | Root properties directly; part properties under the part name                                                                                                        | `label: { color }`, `indicator: { size }`             |
| State    | A single value, or an object per state (`{ base, hover, … }`)                                                                                                        | `backgroundColor: { base: '#fff', checked: 'green' }` |

- CSS variable names are `--<prefix>[-<part>]-<property>[-<state>]`. Only properties in the definition are written, and unspecified ones (including `undefined` values) are not.
- A single value is written to the variables of every state the property has (`'red'` also sets `-checked` and so on to `red`). An object per state writes only the states it has. Omitted states keep the component's CSS defaults (they do not inherit `base`).
- The states are `hover`, `focus` (`:focus-visible`), `active`, `open`, `checked`, `indeterminate`, `readOnly`, `invalid`, and `disabled`. When several apply, a later one in this order wins.
- Length numbers get px; numbers for `opacity`, `fontWeight`, and `lineHeight` are written without a unit. Every value also accepts a `var(--…)` string, so you can connect it to the CSS variables of a theme system.

### `mergeDesign`

```ts
mergeDesign<D extends DesignDefinition>(
  definition: D,
  design?: Design<D>,
  defaultDesign?: Design<D>,
): Design<D>
```

Merges two design values. The properties and states `design` does not specify are filled from `defaultDesign` (the same rules as `defaultDesign` of `createDesignStyle`). A single value in `design` overrides `defaultDesign` in every state, and an object per state fills its omitted states from `defaultDesign`.

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

### `withDesign`

```ts
withDesign<C extends DesignableComponent>(Component: C, design: DefaultDesign<C>): C
```

Creates a component with default design values. The properties and states the `design` given where it is used does not specify are filled from the values given to this function (`mergeDesign`) and passed to the component's `design`. Create it once in your app and place it as is on screens.

```tsx
// Create it once in your app
export const AppCheckbox = withDesign(Checkbox, {
  indicator: { backgroundColor: { checked: 'var(--brand-accent)' } },
});

// Place it as is on screens. The design given where it is used wins over the defaults
<AppCheckbox design={{ gap: 4 }}>I agree</AppCheckbox>;
```

- The component must take design values with a `design` prop and have its design definition in a static `designDefinition` property (every component of `@fringeworks/react-components` has one). Your own components can be wrapped too by adding `designDefinition`.
- It can be layered. An outer `withDesign` wins (the `design` where it is used > outer > inner > the component's CSS defaults).
- The created component has the same type as the wrapped one, keeping the type parameters of generic components (`Table` and so on). It also carries over `designDefinition`.
- It uses no Context and merges the values inside the created component, so you can trace from the code which values apply.

### `createDesign`

```ts
createDesign<D extends DesignDefinition, const O extends CreateDesignOptions>(
  definition: D,
  template: DesignTemplate<D, …>,
  options: O,
): Design<D>
```

Creates design values for a component from inputs such as a primary color and a corner radius (`options`) and a template that assigns colors to design values (`template`). It lets you get good-looking values by passing only base colors, without deciding each design value yourself. Templates are plain data (JSON-compatible values), so the way a designer uses colors can be reflected as is.

Each component of `@fringeworks/react-components` has a `create<ComponentName>Design` function (`createCheckboxDesign` and so on) that calls this function with the component's default template.

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

| Parameter    | Type                  | Description                                                                                      |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| `definition` | `D`                   | Design definition of the component                                                               |
| `template`   | `DesignTemplate<D>`   | Design template: the same shape as design values, with color and length specs in place of values |
| `options`    | `CreateDesignOptions` | Values the design is created from (below)                                                        |

Use the following keys (names of theme color roles) for inputs. All are optional. Anything that does not fit can be passed with a key of your own (templates can refer to it).

| Key                     | Description                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `primaryColor?`         | Primary color, used for emphasized parts such as checked indicators and focus outlines                                                                                                                                                                                               |
| `primaryContrastColor?` | Color of text and marks placed on the primary color. In the default templates, white or black is chosen if omitted                                                                                                                                                                   |
| `errorColor?`           | Error color, used for borders when `invalid`, and so on                                                                                                                                                                                                                              |
| `neutralColor?`         | Base color of the gray family (borders, subdued text, and so on). It may be a gray tinted with the brand color                                                                                                                                                                       |
| `radius?`               | Base corner radius (`number \| CSS length`). Buttons, inputs, and so on use this value; smaller parts such as checkbox indicators use values derived from it. Numbers are px. `'0.5rem'` and `var(--app-radius)` are also accepted. A large value (`9999`) makes buttons pill-shaped |
| `scaling?`              | Multiplier of the padding, gaps, and sizes inside components (density). `1` is the component default; `0.9` makes it tighter and `1.1` roomier                                                                                                                                       |

How template values are written depends on the kind of property. In both cases, all forms other than functions (`DesignColorSpec`, `DesignLengthSpec`) are JSON-compatible data.

Color properties (`color`, `backgroundColor`, `borderColor`, `outlineColor`) take color specs. The conversions use the color functions of `@fringeworks/design-utils`.

| Form                                                                   | Meaning                                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `'primaryColor'`                                                       | Uses the input color as is                                                                                                      |
| `{ from, adjust?, mix?, ensureContrast?, alpha? }`                     | Converts the input color (`adjustColor`, `mixColors`, `ensureContrast`, `changeAlpha`). The given conversions run in this order |
| `{ readableOn, candidates?, minRatio? }`                               | Chooses a readable color on that color from the candidates (white and black by default; `chooseReadableColor`)                  |
| An array                                                               | Tried from the first, and the first that yields a color is used (to fill in an optional input color, and so on)                 |
| A function (`DesignColorFunction`: `(options) => string \| undefined`) | Takes the inputs and returns a color (for what data cannot express). Not allowed inside arrays                                  |

Length properties (`borderRadius`, `borderWidth`, `gap`, `paddingX`, `paddingY`, `marginX`, `marginY`, `size`, `width`, `height`) take length specs.

| Form                                                                              | Meaning                                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `'radius'`                                                                        | Uses the input value as is (numbers are px)                                         |
| `{ from, scale?, min?, max? }`                                                    | Multiplies the base length (`from`) by `scale` and keeps it between `min` and `max` |
| An array                                                                          | Tried from the first, and the first that yields a value is used                     |
| A function (`DesignLengthFunction`: `(options) => string \| number \| undefined`) | Takes the inputs and returns a length (numbers are px). Not allowed inside arrays   |

```ts
{
  // The indicator radius is half of radius, and never rounder than 0.3em
  indicator: { borderRadius: { from: 'radius', scale: 0.5, max: '0.3em' } },
  // Multiplies the component's default gap (6px) by the density
  gap: { from: '6px', scale: 'scaling' },
}
// { radius: 8, scaling: 0.9 } → { indicator: { borderRadius: 'min(4px, 0.3em)' }, gap: '5.4px' }
// { radius: 'var(--app-radius)' } → { indicator: { borderRadius: 'min(calc(var(--app-radius) * 0.5), 0.3em)' } }
```

- `from`, `min`, and `max` take numbers (px) and CSS lengths (`'6px'`, `'0.3em'`, `var(--…)`, and so on) as well as input keys. `scale` takes a number or an input key that passes a number.
- Numbers and plain number-with-unit lengths are calculated (`8 * 0.5` → `4`, `'0.875em' * 0.9` → `'0.788em'`); lengths containing `var()` and the like become `calc()`, `min()`, `max()`, or `clamp()` strings. So theme CSS variables can be used as the base.
- When `min` is larger than `max`, `min` wins (the same as CSS `clamp()`).
- The color `mix.with`, `ensureContrast.against`, and `candidates` take concrete colors (such as `'#ffffff'`) as well as input keys.
- Values that cannot be decided (keys missing from the inputs, colors that cannot be read) are not created. Properties and states not written in the template are not included either. Both keep the component's default look, so you can pass only some of the values.
- A single value without states in the template applies to every state, following the rules of design values.
- Only color and length properties are accepted for now (not `opacity`, `fontWeight`, and so on). Properties and states missing from the definition, keys missing from the inputs, and specs that do not match the kind of property (a color spec on a length property, and so on) are type errors.

### Types

| Type                              | Description                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Option<V>`                       | An option (`value`, `label?`, `disabled?`). You may add properties                                         |
| `DisplayOption<V>`                | An option to show (`Option<V>` with a required `label` and `unlisted`, which tells whether it is unlisted) |
| `UnlistedPlacement`               | Where to show unlisted values (`'hidden'`, `'start'`, `'end'`)                                             |
| `ValueProps<T>`                   | The main value of a display component                                                                      |
| `EditableValueProps<T, TChanged>` | The main value of an input component (a controlled or uncontrolled state)                                  |
| `OpenProps`                       | The open state                                                                                             |
| `InputValueChangeProps`           | The notice of the text in the input                                                                        |
| `MainActionProps<V>`              | The notice of the main action                                                                              |
| `DisabledProps`                   | The setting that disables operation                                                                        |
| `ReadOnlyProps`                   | The setting that prevents changing the value                                                               |
| `RequiredProps`                   | The setting that marks the value as required                                                               |
| `InvalidProps`                    | The setting that marks the value as invalid                                                                |
| `OptionsProps<V>`                 | The options                                                                                                |
| `UnlistedPlacementProps`          | Where to show unlisted values (`unlistedPlacement`)                                                        |
| `KeepUnlistedProps`               | Whether to keep unlisted values that are no longer selected (`keepUnlisted`)                               |
| `SelectAllUnlistedProps`          | The props for how "select all" handles unlisted values (`selectAllIncludesUnlisted`)                       |
| `UseDisplayOptionsResult<V>`      | The result of `useDisplayOptions`                                                                          |
| `DesignDefinition`                | The design definition of a component (the properties the root and each part accept, and their states)      |
| `DesignPartDefinition`            | The properties the root or a part accepts, and their states                                                |
| `Design<D>`                       | The design values passed to a component (created from the definition)                                      |
| `DesignValue<T, S>`               | A design value (a single value, or an object per state)                                                    |
| `DesignState`                     | The states design values are split by                                                                      |
| `DesignProperty`                  | The names of design properties                                                                             |
| `DesignPropertyValues`            | The design properties and the types of values they accept                                                  |
| `DesignStyle`                     | The `style` of CSS variables `createDesignStyle` creates                                                   |
| `DesignableComponent<D>`          | A component `withDesign` can wrap (one that takes `design` and has `designDefinition`)                     |
| `DefaultDesign<C>`                | The default design values passed to `withDesign`                                                           |
| `CreateDesignOptions`             | Values passed to `createDesign` that the design is created from                                            |
| `DesignTemplate<D, O>`            | Design template (the same shape as design values, with color and length specs in place of values)          |
| `DesignColorSpec<K>`              | A spec that creates a color (JSON-compatible data)                                                         |
| `DesignColorFunction<O>`          | A function that takes the inputs and returns a color (written as a template value)                         |
| `DesignColorKey<O>`               | Input keys that pass colors                                                                                |
| `DesignColorProperty`             | Design properties that take color values                                                                   |
| `DesignLengthSpec<K>`             | A spec that creates a length (JSON-compatible data)                                                        |
| `DesignLengthFunction<O>`         | A function that takes the inputs and returns a length (written as a template value)                        |
| `DesignLengthKey<O>`              | Input keys that pass lengths or multipliers                                                                |
| `DesignLengthProperty`            | Design properties that take length values                                                                  |

## License

MIT
