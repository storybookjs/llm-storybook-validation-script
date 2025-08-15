import type { Meta, StoryObj } from '@storybook/react-vite';

const PerfectComponent = ({ text, count, disabled = false }: { text: string; count: number; disabled?: boolean }) => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>{text}</h3>
      <p>Count: {count}</p>
      <button disabled={disabled} style={{ padding: '8px 16px', borderRadius: '4px' }}>
        {disabled ? 'Disabled' : 'Click me'}
      </button>
    </div>
  );
};

const meta: Meta<typeof PerfectComponent> = {
  title: 'Test/Perfect',
  component: PerfectComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The main text to display',
    },
    count: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'The count value to display',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    text: 'Hello World',
    count: 42,
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    text: 'Secondary Story',
    count: 100,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    text: 'Disabled State',
    count: 0,
    disabled: true,
  },
};

export const WithIcon: Story = {
  args: {
    text: 'Story with Icon',
    count: 7,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the component with an icon.',
      },
    },
  },
};
