import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterSignup } from '../NewsletterSignup';

describe('NewsletterSignup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default card variant', () => {
      render(<NewsletterSignup />);

      expect(screen.getByText('Never Miss a Transfer')).toBeInTheDocument();
      expect(
        screen.getByText(/Get the latest ITK updates/)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email address')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Subscribe to Transfer Juice' })
      ).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<NewsletterSignup className='custom-class' />);

      const component = screen
        .getByText('Never Miss a Transfer')
        .closest('div');
      expect(component).toHaveClass('custom-class');
    });
  });

  describe('Variant: Card', () => {
    it('renders card variant with all elements', () => {
      render(<NewsletterSignup variant='card' />);

      expect(screen.getByText('Never Miss a Transfer')).toBeInTheDocument();
      expect(
        screen.getByText(/3x daily briefings covering all the transfer gossip/)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Enter your email address')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Subscribe to Transfer Juice' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/By subscribing, you agree to receive/)
      ).toBeInTheDocument();
    });

    it('shows success state after submission', async () => {
      render(<NewsletterSignup variant='card' />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      // Fast forward the mock API call
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
        expect(
          screen.getByText('Check your email for confirmation')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Variant: Hero', () => {
    it('renders hero variant with simplified layout', () => {
      render(<NewsletterSignup variant='hero' />);

      expect(
        screen.getByPlaceholderText('Enter your email')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Get Transfer Updates' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/3x daily briefings. Unsubscribe anytime/)
      ).toBeInTheDocument();

      // Should not have card-specific elements
      expect(
        screen.queryByText('Never Miss a Transfer')
      ).not.toBeInTheDocument();
    });

    it('shows hero success state', async () => {
      render(<NewsletterSignup variant='hero' />);

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', {
        name: 'Get Transfer Updates',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're in!")).toBeInTheDocument();
        expect(
          screen.getByText('Welcome to the Transfer Juice family')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Variant: Inline', () => {
    it('renders inline variant with horizontal layout', () => {
      render(<NewsletterSignup variant='inline' />);

      expect(screen.getByPlaceholderText('Your email')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Subscribe' })
      ).toBeInTheDocument();

      // Should not have card-specific elements
      expect(
        screen.queryByText('Never Miss a Transfer')
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/3x daily briefings/)).not.toBeInTheDocument();
    });

    it('shows inline success state', async () => {
      render(<NewsletterSignup variant='inline' />);

      const emailInput = screen.getByPlaceholderText('Your email');
      const submitButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(
          screen.getByText('Successfully subscribed!')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    it('disables submit button for invalid email', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      // Initially disabled (empty email)
      expect(submitButton).toBeDisabled();

      // Invalid email
      await userEvent.type(emailInput, 'invalid-email');
      expect(submitButton).toBeDisabled();

      // Valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      expect(submitButton).not.toBeDisabled();
    });

    it('validates email format correctly', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      const testCases = [
        { email: 'test@example.com', valid: true },
        { email: 'user+tag@domain.co.uk', valid: true },
        { email: 'simple@test.org', valid: true },
        { email: 'invalid-email', valid: false },
        { email: '@domain.com', valid: false },
        { email: 'user@', valid: false },
        { email: 'user@domain', valid: false },
        { email: '', valid: false },
      ];

      for (const { email, valid } of testCases) {
        await userEvent.clear(emailInput);
        if (email) {
          await userEvent.type(emailInput, email);
        }

        if (valid) {
          expect(submitButton).not.toBeDisabled();
        } else {
          expect(submitButton).toBeDisabled();
        }
      }
    });
  });

  describe('Form Submission', () => {
    it('handles successful subscription', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      // Should show loading state
      expect(submitButton).toBeDisabled();

      // Fast forward the mock API call
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
      });

      // Email should be cleared
      expect(emailInput).toHaveValue('');
    });

    it('shows loading state during submission', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      // Check loading state
      expect(submitButton).toBeDisabled();

      // Fast forward timers
      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
      });
    });

    it('handles submission errors gracefully', async () => {
      // Mock console.error to avoid error logs in tests
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Override the setTimeout mock to simulate an error
      const originalSetTimeout = setTimeout;
      jest.useRealTimers();
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        return originalSetTimeout(() => {
          throw new Error('Network error');
        }, 0) as any;
      });

      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to subscribe. Please try again.')
        ).toBeInTheDocument();
      });

      // Button should be re-enabled
      expect(submitButton).not.toBeDisabled();

      consoleSpy.mockRestore();
    });

    it('prevents form submission with invalid email', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const form = emailInput.closest('form')!;
      const submitHandler = jest.fn((e) => e.preventDefault());

      form.addEventListener('submit', submitHandler);

      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.submit(form);

      // Submit handler should not be called with invalid email
      expect(submitHandler).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');

      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('maintains keyboard navigation', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      // Tab navigation
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      await userEvent.tab();
      expect(document.activeElement).toBe(submitButton);
    });

    it('handles error states accessibly', async () => {
      // Force an error by mocking the API call to fail
      jest.useRealTimers();
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        setTimeout(() => {
          throw new Error('Test error');
        }, 0);
        return 123 as any;
      });

      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          'Failed to subscribe. Please try again.'
        );
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Success State Icons', () => {
    it('displays success icon in card variant', async () => {
      render(<NewsletterSignup variant='card' />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const successIcon = screen
          .getByText("You're subscribed!")
          .parentElement?.querySelector('svg');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('w-6', 'h-6', 'text-white');
      });
    });

    it('displays success icon in hero variant', async () => {
      render(<NewsletterSignup variant='hero' />);

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', {
        name: 'Get Transfer Updates',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const successIcon = screen
          .getByText("You're in!")
          .parentElement?.querySelector('svg');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('w-8', 'h-8', 'text-white');
      });
    });

    it('displays success icon in inline variant', async () => {
      render(<NewsletterSignup variant='inline' />);

      const emailInput = screen.getByPlaceholderText('Your email');
      const submitButton = screen.getByRole('button', { name: 'Subscribe' });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        const successIcon = screen
          .getByText('Successfully subscribed!')
          .parentElement?.querySelector('svg');
        expect(successIcon).toBeInTheDocument();
        expect(successIcon).toHaveClass('w-5', 'h-5', 'text-green-500');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid form submissions', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');

      // Rapid clicks
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
      });

      // Should only have one success message
      expect(screen.getAllByText("You're subscribed!")).toHaveLength(1);
    });

    it('resets form state correctly after success', async () => {
      render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      jest.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText("You're subscribed!")).toBeInTheDocument();
      });

      // Form should be reset
      expect(emailInput).toHaveValue('');
    });

    it('handles component unmounting during submission', async () => {
      const { unmount } = render(<NewsletterSignup />);

      const emailInput = screen.getByPlaceholderText(
        'Enter your email address'
      );
      const submitButton = screen.getByRole('button', {
        name: 'Subscribe to Transfer Juice',
      });

      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      // Unmount before API call completes
      unmount();

      // Fast forward timers - should not throw errors
      expect(() => {
        jest.advanceTimersByTime(1000);
      }).not.toThrow();
    });
  });
});
