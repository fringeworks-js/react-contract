import adjustColor from '@fringeworks/design-utils/adjustColor';
import changeAlpha from '@fringeworks/design-utils/changeAlpha';
import chooseReadableColor from '@fringeworks/design-utils/chooseReadableColor';
import ensureContrast from '@fringeworks/design-utils/ensureContrast';
import mixColors from '@fringeworks/design-utils/mixColors';
import type { AbsoluteColor } from '@fringeworks/types';
import type {
  Design,
  DesignDefinition,
  DesignPartDefinition,
  DesignProperty,
} from '../createDesignStyle';
import resolveLength, { type AnyLengthSpec } from './_resolveLength';
import type {
  CreateDesignOptions,
  DesignColorFunction,
  DesignColorProperty,
  DesignColorSpec,
  DesignLengthProperty,
  DesignTemplate,
} from './types';

const COLOR_PROPERTIES: ReadonlySet<DesignProperty> =
  new Set<DesignColorProperty>([
    'color',
    'backgroundColor',
    'borderColor',
    'outlineColor',
  ]);

const LENGTH_PROPERTIES: ReadonlySet<DesignProperty> =
  new Set<DesignLengthProperty>([
    'borderWidth',
    'borderRadius',
    'width',
    'height',
    'size',
    'gap',
    'paddingX',
    'paddingY',
    'marginX',
    'marginY',
  ]);

type AnySpec =
  DesignColorSpec<string> | DesignColorFunction<Record<string, unknown>>;
type AnyValueSpec = AnySpec | AnyLengthSpec;
type AnyPartTemplate = Partial<
  Record<DesignProperty, AnyValueSpec | Record<string, AnyValueSpec>>
>;

/**
 * 割り当ての中の色の参照（入力のキーか、具体的な色）を、色にする\
 * 入力のキーなら入力の値、そうでなければ具体的な色として扱う
 */
function resolveReference(
  reference: string,
  options: Record<string, unknown>,
): AbsoluteColor | undefined {
  if (Object.prototype.hasOwnProperty.call(options, reference)) {
    const value = options[reference];
    return typeof value === 'string' ? (value as AbsoluteColor) : undefined;
  }
  return reference as AbsoluteColor;
}

/**
 * 入力のキーが指す色を読み、16進数の色にする（読めない色は undefined）
 */
function resolveKey(
  key: string,
  options: Record<string, unknown>,
): AbsoluteColor | undefined {
  if (!Object.prototype.hasOwnProperty.call(options, key)) {
    return undefined;
  }
  const value = options[key];
  return typeof value === 'string'
    ? adjustColor(value as AbsoluteColor, {})
    : undefined;
}

/**
 * 先頭から順に試す、色を作る指定の配列か\
 * `Array.isArray` は `readonly` の配列に型を絞らないため、型の絞り込みを自分で書く
 */
function isSpecList(spec: AnySpec): spec is readonly DesignColorSpec<string>[] {
  return Array.isArray(spec);
}

/**
 * 色を作る指定から、色を作る
 */
function resolveSpec(
  spec: AnySpec,
  options: Record<string, unknown>,
): string | undefined {
  if (typeof spec === 'function') {
    return spec(options);
  }
  if (typeof spec === 'string') {
    return resolveKey(spec, options);
  }
  if (isSpecList(spec)) {
    for (const item of spec) {
      const color = resolveSpec(item, options);
      if (color !== undefined) {
        return color;
      }
    }
    return undefined;
  }
  if ('readableOn' in spec) {
    const background = resolveKey(spec.readableOn, options);
    if (background === undefined) {
      return undefined;
    }
    const candidates = spec.candidates
      ?.map((candidate) => resolveReference(candidate, options))
      .filter((candidate) => candidate !== undefined);
    return chooseReadableColor(background, candidates, {
      minRatio: spec.minRatio,
    });
  }
  let color: AbsoluteColor | undefined = resolveKey(spec.from, options);
  if (color !== undefined && spec.adjust !== undefined) {
    color = adjustColor(color, spec.adjust);
  }
  if (color !== undefined && spec.mix !== undefined) {
    const other = resolveReference(spec.mix.with, options);
    color =
      other === undefined ? undefined : mixColors(color, other, spec.mix.ratio);
  }
  if (color !== undefined && spec.ensureContrast !== undefined) {
    const against = resolveReference(spec.ensureContrast.against, options);
    color =
      against === undefined
        ? undefined
        : ensureContrast(color, against, spec.ensureContrast.ratio);
  }
  if (color !== undefined && spec.alpha !== undefined) {
    color = changeAlpha(color, spec.alpha);
  }
  return color;
}

/**
 * 値を作る指定か（状態ごとのオブジェクトでないか）
 */
function isSpec(
  value: AnyValueSpec | Record<string, AnyValueSpec>,
): value is AnyValueSpec {
  return (
    typeof value !== 'object' ||
    Array.isArray(value) ||
    'from' in value ||
    'readableOn' in value
  );
}

/**
 * プロパティの種類に合わせて、値を作る指定から値を作る
 */
function resolveValue(
  property: DesignProperty,
  spec: AnyValueSpec,
  options: Record<string, unknown>,
): string | number | undefined {
  return COLOR_PROPERTIES.has(property)
    ? resolveSpec(spec as AnySpec, options)
    : resolveLength(spec as AnyLengthSpec, options);
}

/**
 * 部分（またはルート）の割り当てから、デザインの値を作る
 */
function createPart(
  definition: DesignPartDefinition | undefined,
  template: AnyPartTemplate | undefined,
  options: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (definition === undefined || template === undefined) {
    return undefined;
  }
  const part: Record<string, unknown> = {};
  for (const property of Object.keys(definition) as DesignProperty[]) {
    const value = template[property];
    if (
      value === undefined ||
      !(COLOR_PROPERTIES.has(property) || LENGTH_PROPERTIES.has(property))
    ) {
      continue;
    }
    if (isSpec(value)) {
      const resolved = resolveValue(property, value, options);
      if (resolved !== undefined) {
        part[property] = resolved;
      }
      continue;
    }
    // 状態ごとのオブジェクト: 値が決まった状態だけを入れる
    const states: Record<string, string | number> = {};
    for (const [state, spec] of Object.entries(value)) {
      const resolved = resolveValue(property, spec, options);
      if (resolved !== undefined) {
        states[state] = resolved;
      }
    }
    if (Object.keys(states).length > 0) {
      part[property] = states;
    }
  }
  return Object.keys(part).length === 0 ? undefined : part;
}

/**
 * 入力（メインの色・角の丸みなど）と割り当てから、部品に渡すデザインの値を作る
 *
 * 割り当て（`template`）は、部品のデザインの値と同じ形で、値の所に色・長さを作る指定を書いたもの。
 * 定義（`definition`）にあるプロパティだけを扱う。値が決まらないもの（入力に無い・読めない色）と、割り当てに書かなかったプロパティ・状態は、
 * デザインの値に入らない（部品の既定の見た目のまま）。
 *
 * @example
 * createDesign(
 *   checkboxDesignDefinition,
 *   {
 *     indicator: {
 *       backgroundColor: { checked: 'primaryColor' },
 *       color: { checked: { readableOn: 'primaryColor' } },
 *     },
 *   },
 *   { primaryColor: '#0a7d5a' },
 * );
 * // → { indicator: { backgroundColor: { checked: '#0a7d5a' }, color: { checked: '#ffffff' } } }
 *
 * @param definition 部品のデザインの定義
 * @param template デザインの割り当て
 * @param options デザインの元になる値（`primaryColor` など）
 * @returns 部品に渡すデザインの値
 */
export default function createDesign<
  D extends DesignDefinition,
  const O extends CreateDesignOptions,
>(definition: D, template: DesignTemplate<D, O>, options: O): Design<D> {
  const values = options as Record<string, unknown>;
  const templates = template as Record<string, AnyPartTemplate | undefined>;
  const design: Record<string, unknown> = {
    ...createPart(definition.properties, templates as AnyPartTemplate, values),
  };
  for (const [part, partDefinition] of Object.entries(definition.parts ?? {})) {
    const partDesign = createPart(partDefinition, templates[part], values);
    if (partDesign !== undefined) {
      design[part] = partDesign;
    }
  }
  return design as Design<D>;
}
