import type { Meta, StoryObj } from '@storybook/react-vite';

// TypeScript Error: Wrong type for component
const meta: Meta<{ text: string; count: number }> = {
  title: 'Test/TypeScriptError',
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
    // TypeScript Error: Missing required prop
    text: 'Hello World',
    // count is missing
  },
};

export const Secondary: Story = {
  args: {
    // TypeScript Error: Wrong type for count
    text: 'Secondary story',
    count: 'should be number' as any, // string instead of number
  },
};

export const Tertiary: Story = {
  args: {
    // TypeScript Error: Extra prop that doesn't exist
    text: 'Tertiary story',
    count: 42,
    extraProp: 'this prop is not defined in the type' as any,
  },
};

// TypeScript Error: Function with wrong return type
function wrongReturnType(): string {
  return 42; // Should return string, returning number
}