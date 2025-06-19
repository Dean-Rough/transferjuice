import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-lg'
      );
    });

    it('renders children correctly', () => {
      render(<Button>Test Button Text</Button>);

      expect(screen.getByText('Test Button Text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className='custom-class'>Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-orange-gradient', 'text-brand-black');
    });

    it('renders secondary variant', () => {
      render(<Button variant='secondary'>Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'bg-dark-surface',
        'border',
        'border-dark-border'
      );
    });

    it('renders ghost variant', () => {
      render(<Button variant='ghost'>Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-dark-text-secondary');
    });

    it('renders outline variant', () => {
      render(<Button variant='outline'>Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'border',
        'border-brand-orange-500',
        'text-brand-orange-500'
      );
    });

    it('renders destructive variant', () => {
      render(<Button variant='destructive'>Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });

    it('renders link variant', () => {
      render(<Button variant='link'>Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-brand-orange-500', 'underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-6', 'text-base');
    });

    it('renders small size', () => {
      render(<Button size='sm'>Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'text-sm');
    });

    it('renders large size', () => {
      render(<Button size='lg'>Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-13', 'px-8', 'text-lg');
    });

    it('renders extra large size', () => {
      render(<Button size='xl'>Extra Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-16', 'px-10', 'text-xl');
    });

    it('renders icon size', () => {
      render(<Button size='icon'>🔥</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:opacity-50'
      );
    });

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      // Check for loading spinner
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('shows both loading spinner and text', () => {
      render(<Button loading>Saving...</Button>);

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not trigger click when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard navigation', () => {
      render(<Button>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('handles form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type='submit'>Submit</Button>
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label='Custom label'>🔥</Button>);

      const button = screen.getByLabelText('Custom label');
      expect(button).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby='description'>Button</Button>
          <div id='description'>This button does something</div>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('has proper focus styles', () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2'
      );
    });

    it('maintains accessibility when disabled', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('maintains accessibility when loading', () => {
      render(
        <Button loading aria-label='Loading'>
          Loading
        </Button>
      );

      const button = screen.getByLabelText('Loading');
      expect(button).toBeDisabled();
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML button attributes', () => {
      render(
        <Button
          type='submit'
          name='submit-btn'
          value='submit-value'
          data-testid='custom-button'
        >
          Submit
        </Button>
      );

      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('value', 'submit-value');
    });

    it('supports ref forwarding', () => {
      const ref = jest.fn();

      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button></Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('handles complex children', () => {
      render(
        <Button>
          <span>Complex</span>
          <strong>Children</strong>
        </Button>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('combines variant and size classes correctly', () => {
      render(
        <Button variant='secondary' size='lg'>
          Large Secondary
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-dark-surface'); // from secondary variant
      expect(button).toHaveClass('h-13', 'px-8'); // from lg size
    });

    it('handles multiple class combinations', () => {
      render(
        <Button
          variant='outline'
          size='sm'
          className='custom-class'
          loading
          disabled
        >
          Complex Button
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-brand-orange-500'); // outline variant
      expect(button).toHaveClass('h-9'); // sm size
      expect(button).toHaveClass('custom-class'); // custom class
      expect(button).toBeDisabled(); // disabled from loading
    });
  });
});
