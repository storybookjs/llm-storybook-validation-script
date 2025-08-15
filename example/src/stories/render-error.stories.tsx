import type { Meta, StoryObj } from '@storybook/react-vite';

// Component that will fail to render
const BrokenComponent = () => {
  // This will cause a render error
  throw new Error('Component failed to render');
  
};

const meta: Meta<typeof BrokenComponent> = {
  title: 'Test/RenderError',
  component: BrokenComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};

export const Secondary: Story = {
  args: {},
  render: () => {
    // Another render error
    const undefinedVariable = undefined;
    return <div>{undefinedVariable.property}</div>;
  },
};

export const Tertiary: Story = {
  args: {},
  render: () => {
    // Component that returns null (might cause issues)
    return null;
  },
};
