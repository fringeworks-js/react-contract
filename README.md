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

| Name                                                        | Description                                         |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `useDisplayOptions(options, value, props?)`                 | Creates the options to show for the selected values |
| `createDisplayOptions(options, unlistedValues, placement?)` | Creates the options to show (without React)         |

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

## License

MIT
