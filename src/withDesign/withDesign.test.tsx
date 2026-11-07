import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Design, DesignDefinition } from '../createDesignStyle';
import createDesignStyle from '../createDesignStyle';
import withDesign from './withDesign';

const definition = {
  properties: { gap: [] },
  parts: { mark: { backgroundColor: ['checked'] } },
} as const satisfies DesignDefinition;

type BoxProps<T> = {
  value: T;
  design?: Design<typeof definition>;
};

function Box<T>({ value, design }: BoxProps<T>) {
  return (
    <div
      data-testid="box"
      data-value={String(value)}
      style={createDesignStyle('box', definition, design)}
    />
  );
}
Box.designDefinition = definition;

const getStyle = (name: string) =>
  screen.getByTestId('box').style.getPropertyValue(name);

describe('withDesign', () => {
  it('既定のデザインの値を部品に渡す。ほかのプロパティはそのまま渡す', () => {
    const AppBox = withDesign(Box, { gap: 4 });
    render(<AppBox value={1} />);
    expect(getStyle('--box-gap')).toBe('4px');
    expect(screen.getByTestId('box').dataset.value).toBe('1');
  });

  it('使う場所の design を優先し、省略した状態を既定の値で補う', () => {
    const AppBox = withDesign(Box, {
      gap: 4,
      mark: { backgroundColor: { base: 'red', checked: 'pink' } },
    });
    render(
      <AppBox
        value={1}
        design={{ mark: { backgroundColor: { base: 'blue' } } }}
      />,
    );
    expect(getStyle('--box-gap')).toBe('4px');
    expect(getStyle('--box-mark-backgroundColor')).toBe('blue');
    expect(getStyle('--box-mark-backgroundColor-checked')).toBe('pink');
  });

  it('重ねると、外側の withDesign ほど優先する', () => {
    const AppBox = withDesign(Box, {
      gap: 4,
      mark: { backgroundColor: 'red' },
    });
    const DialogBox = withDesign(AppBox, { gap: 8 });
    render(<DialogBox value={1} />);
    expect(getStyle('--box-gap')).toBe('8px');
    expect(getStyle('--box-mark-backgroundColor')).toBe('red');
  });

  it('designDefinition を引き継ぎ、displayName を付ける', () => {
    const AppBox = withDesign(Box, {});
    expect(AppBox.designDefinition).toBe(definition);
    expect((AppBox as { displayName?: string }).displayName).toBe(
      'withDesign(Box)',
    );
  });

  it('作ったコンポーネントは、包んだ部品と同じ型（型引数も残る）', () => {
    const AppBox = withDesign(Box, {});
    expectTypeOf(AppBox).toEqualTypeOf<typeof Box>();
    render(<AppBox<string> value="a" />);
    expect(screen.getByTestId('box').dataset.value).toBe('a');
  });
});
