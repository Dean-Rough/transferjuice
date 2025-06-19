import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Input data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('flex', 'w-full', 'rounded-lg', 'border');
    });

    it('renders with placeholder', () => {
      render(<Input placeholder='Enter text' />);

      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('applies default variant and size', () => {
      render(<Input data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-dark-border',
        'h-11',
        'px-4',
        'text-base'
      );
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Input variant='default' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-dark-border',
        'focus-visible:border-brand-orange-500'
      );
    });

    it('renders error variant', () => {
      render(<Input variant='error' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-red-500',
        'focus-visible:border-red-500'
      );
    });

    it('renders success variant', () => {
      render(<Input variant='success' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'border-green-500',
        'focus-visible:border-green-500'
      );
    });

    it('automatically applies error variant when error prop is provided', () => {
      render(<Input error='This is an error' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Sizes', () => {
    it('renders medium size by default', () => {
      render(<Input data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-11', 'px-4', 'text-base');
    });

    it('renders small size', () => {
      render(<Input size='sm' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-9', 'px-3', 'text-sm');
    });

    it('renders large size', () => {
      render(<Input size='lg' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-13', 'px-5', 'text-lg');
    });
  });

  describe('Label and Helper Text', () => {
    it('renders with label', () => {
      render(<Input label='Email Address' data-testid='input' />);

      const label = screen.getByText('Email Address');
      const input = screen.getByTestId('input');

      expect(label).toBeInTheDocument();
      expect(label).toHaveClass(
        'text-sm',
        'font-medium',
        'text-dark-text-primary'
      );
      expect(input).toBeInTheDocument();
    });

    it('shows required indicator with label', () => {
      render(<Input label='Required Field' required data-testid='input' />);

      const label = screen.getByText('Required Field');
      const requiredIndicator = screen.getByText('*');

      expect(label).toBeInTheDocument();
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('renders with helper text', () => {
      render(
        <Input helperText='This is helpful information' data-testid='input' />
      );

      const helperText = screen.getByText('This is helpful information');
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass('text-sm', 'text-dark-text-muted');
    });

    it('renders with error message', () => {
      render(<Input error='This field is required' data-testid='input' />);

      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-sm', 'text-red-500');
    });

    it('prioritizes error message over helper text', () => {
      render(
        <Input
          error='Error message'
          helperText='Helper text'
          data-testid='input'
        />
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('renders complete input with all elements', () => {
      render(
        <Input
          label='Email'
          placeholder='Enter your email'
          helperText="We'll never share your email"
          required
          data-testid='input'
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email')
      ).toBeInTheDocument();
      expect(
        screen.getByText("We'll never share your email")
      ).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(<Input data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(<Input type='email' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input type='password' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input type='number' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Input disabled data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass(
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('handles required state', () => {
      render(<Input required data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
    });

    it('handles readonly state', () => {
      render(<Input readOnly data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('readonly');
    });
  });

  describe('Interactions', () => {
    it('handles value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} data-testid='input' />);

      const input = screen.getByTestId('input');
      await user.type(input, 'test value');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test value');
    });

    it('handles controlled value', () => {
      const { rerender } = render(
        <Input value='initial' onChange={() => {}} data-testid='input' />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('initial');

      rerender(
        <Input value='updated' onChange={() => {}} data-testid='input' />
      );
      expect(input).toHaveValue('updated');
    });

    it('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(
        <Input onFocus={handleFocus} onBlur={handleBlur} data-testid='input' />
      );

      const input = screen.getByTestId('input');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();

      render(<Input onKeyDown={handleKeyDown} data-testid='input' />);

      const input = screen.getByTestId('input');
      await user.type(input, 'test');

      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<Input className='custom-input' data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-input');
    });

    it('combines variant classes with custom classes', () => {
      render(
        <Input
          variant='error'
          size='lg'
          className='custom-class'
          data-testid='input'
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-red-500'); // error variant
      expect(input).toHaveClass('h-13'); // lg size
      expect(input).toHaveClass('custom-class'); // custom class
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML input attributes', () => {
      render(
        <Input
          name='email'
          id='email-input'
          autoComplete='email'
          data-testid='input'
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('name', 'email');
      expect(input).toHaveAttribute('id', 'email-input');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('supports ref forwarding', () => {
      const ref = jest.fn();
      render(<Input ref={ref} />);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Input aria-label='Search input' data-testid='input' />);

      const input = screen.getByLabelText('Search input');
      expect(input).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <div>
          <Input aria-describedby='description' data-testid='input' />
          <div id='description'>Input description</div>
        </div>
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-describedby', 'description');
    });

    it('has proper focus styles', () => {
      render(<Input data-testid='input' />);

      const input = screen.getByTestId('input');
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1'
      );
    });

    it('maintains accessibility when disabled', () => {
      render(
        <Input disabled aria-label='Disabled input' data-testid='input' />
      );

      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('aria-label', 'Disabled input');
    });
  });

  describe('Form Integration', () => {
    it('works within a form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input name='username' data-testid='input' />
          <button type='submit'>Submit</button>
        </form>
      );

      const input = screen.getByTestId('input');
      const button = screen.getByRole('button');

      fireEvent.change(input, { target: { value: 'testuser' } });
      fireEvent.click(button);

      expect(handleSubmit).toHaveBeenCalled();
      expect(input).toHaveValue('testuser');
    });

    it('supports form validation attributes', () => {
      render(
        <Input
          required
          pattern='[a-z]+'
          minLength={3}
          maxLength={20}
          data-testid='input'
        />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('pattern', '[a-z]+');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '20');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty error string', () => {
      render(<Input error='' data-testid='input' />);

      const input = screen.getByTestId('input');
      // Should not apply error variant for empty error string
      expect(input).toHaveClass('border-dark-border');
    });

    it('handles null/undefined values gracefully', () => {
      render(
        <Input value={undefined} onChange={() => {}} data-testid='input' />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('');
    });

    it('handles complex input scenarios', () => {
      render(
        <Input
          label='Complex Input'
          type='email'
          size='lg'
          variant='success'
          className='custom-class'
          placeholder='complex@example.com'
          helperText='This input has many props'
          required
          data-testid='input'
        />
      );

      const input = screen.getByTestId('input');
      const label = screen.getByText('Complex Input');
      const helperText = screen.getByText('This input has many props');

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveClass('h-13', 'border-green-500', 'custom-class');
      expect(input).toHaveAttribute('required');
      expect(label).toBeInTheDocument();
      expect(helperText).toBeInTheDocument();
    });
  });
});
