import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

const InteractiveComponent = () => {
  return (
    <div>
      <button data-testid="test-button">Click me</button>
      <input data-testid="test-input" type="text" placeholder="Enter text" />
      <div data-testid="output">No output yet</div>
    </div>
  );
};

const meta: Meta<typeof InteractiveComponent> = {
  title: 'Test/InteractionError',
  component: InteractiveComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // This will fail - button doesn't exist with this testid
    const nonExistentButton = canvas.getByTestId('non-existent-button');
    await userEvent.click(nonExistentButton);
  },
};

export const Secondary: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // This will fail - trying to interact with undefined element
    const button = canvas.getByTestId('test-button');
    await userEvent.click(button);
    
    // This will fail - assertion error
    const output = canvas.getByTestId('output');
    await expect(output).toHaveTextContent('Expected text that will never match');
  },
};

export const Tertiary: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // This will fail - runtime error in the play function
    const input = canvas.getByTestId('test-input');
    await userEvent.type(input, 'test text');
    
    // This will throw an error
    throw new Error('Play function failed intentionally');
  },
};
