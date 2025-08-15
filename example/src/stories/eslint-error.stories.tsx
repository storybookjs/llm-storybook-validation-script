import type { Meta, StoryObj } from '@storybook/react';

// ESLint Error: Unused variable
// @ts-expect-error Ignore for testing
const unusedVariable = 'this will cause an ESLint error';

// ESLint Error: Missing semicolon
// @ts-expect-error Ignore for testing
const missingSemicolon = 'missing semicolon'

// ESLint Error: Unused import
// @ts-expect-error Ignore for testing
import { useState } from 'react';

const meta: Meta = {
  title: 'Test/ESLintError',
  component: () => <div>Test Component</div>,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    // ESLint Error: Trailing comma
    text: 'Hello World',
  },
};

export const Secondary: Story = {
  args: {
    text: 'Secondary story',
  },
};
