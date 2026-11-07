import type { DesignLengthFunction, DesignLengthSpec } from './types';

export type AnyLengthSpec =
  DesignLengthSpec<string> | DesignLengthFunction<Record<string, unknown>>;

/**
 * 入力のキーの形（識別子）。CSS の長さは数字か関数で始まるので、この形にはならない
 */
const KEY_PATTERN = /^[A-Za-z_$][\w$]*$/;

/**
 * 数値と単位だけの長さ（`0.875em`・`8px` など）。JS で計算できる
 */
const SIMPLE_LENGTH_PATTERN = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/;

/**
 * 小数点以下 3 桁に丸める（浮動小数点の誤差を値に残さないため）
 */
function round(value: number) {
  return Math.round(value * 1000) / 1000 + 0;
}

/**
 * 割り当ての中の長さの参照（入力のキー、数値、CSS の長さ）を、長さにする
 */
function resolveReference(
  reference: string | number,
  options: Record<string, unknown>,
): string | number | undefined {
  if (typeof reference === 'number') {
    return reference;
  }
  if (!KEY_PATTERN.test(reference)) {
    return reference;
  }
  if (!Object.prototype.hasOwnProperty.call(options, reference)) {
    return undefined;
  }
  const value = options[reference];
  return typeof value === 'number' || typeof value === 'string'
    ? value
    : undefined;
}

/**
 * 長さを CSS の値の文字列にする（数値は px）
 */
function toCss(value: string | number) {
  return typeof value === 'number' ? `${round(value)}px` : value;
}

/**
 * 長さに倍率を掛ける。計算できるもの（数値、数値と単位だけの長さ）は計算し、それ以外は `calc()` にする
 */
function scaleLength(value: string | number, scale: number): string | number {
  if (scale === 1) {
    return value;
  }
  if (typeof value === 'number') {
    return round(value * scale);
  }
  const match = SIMPLE_LENGTH_PATTERN.exec(value);
  if (match !== null) {
    return `${round(Number(match[1]) * scale)}${match[2]}`;
  }
  return `calc(${value} * ${scale})`;
}

/**
 * 長さを下限・上限の間に収める。下限が上限より大きいときは下限を優先する（CSS の `clamp()` と同じ）
 */
function clampLength(
  value: string | number,
  min: string | number | undefined,
  max: string | number | undefined,
): string | number {
  if (min === undefined && max === undefined) {
    return value;
  }
  if (
    typeof value === 'number' &&
    (min === undefined || typeof min === 'number') &&
    (max === undefined || typeof max === 'number')
  ) {
    let result = value;
    if (max !== undefined) {
      result = Math.min(result, max);
    }
    if (min !== undefined) {
      result = Math.max(result, min);
    }
    return result;
  }
  if (min !== undefined && max !== undefined) {
    return `clamp(${toCss(min)}, ${toCss(value)}, ${toCss(max)})`;
  }
  if (max !== undefined) {
    return `min(${toCss(value)}, ${toCss(max)})`;
  }
  return `max(${toCss(value)}, ${toCss(min!)})`;
}

/**
 * 先頭から順に試す、長さを作る指定の配列か\
 * `Array.isArray` は `readonly` の配列に型を絞らないため、型の絞り込みを自分で書く
 */
function isSpecList(
  spec: AnyLengthSpec,
): spec is readonly DesignLengthSpec<string>[] {
  return Array.isArray(spec);
}

/**
 * 長さを作る指定から、長さを作る（数値は px）
 */
export default function resolveLength(
  spec: AnyLengthSpec,
  options: Record<string, unknown>,
): string | number | undefined {
  if (typeof spec === 'function') {
    return spec(options);
  }
  if (typeof spec === 'string') {
    return resolveReference(spec, options);
  }
  if (isSpecList(spec)) {
    for (const item of spec) {
      const length = resolveLength(item, options);
      if (length !== undefined) {
        return length;
      }
    }
    return undefined;
  }
  const base = resolveReference(spec.from, options);
  if (base === undefined) {
    return undefined;
  }
  let scale = 1;
  if (spec.scale !== undefined) {
    const resolved =
      typeof spec.scale === 'number'
        ? spec.scale
        : resolveReference(spec.scale, options);
    if (typeof resolved !== 'number') {
      return undefined;
    }
    scale = resolved;
  }
  const min =
    spec.min === undefined ? undefined : resolveReference(spec.min, options);
  const max =
    spec.max === undefined ? undefined : resolveReference(spec.max, options);
  // 書いた下限・上限が決まらない（入力に無い）ときは、値を作らない
  if (
    (spec.min !== undefined && min === undefined) ||
    (spec.max !== undefined && max === undefined)
  ) {
    return undefined;
  }
  return clampLength(scaleLength(base, scale), min, max);
}
