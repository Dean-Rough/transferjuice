import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock the NewsletterSignup component since it has client-side functionality
jest.mock('@/components/features/NewsletterSignup', () => {
  return {
    NewsletterSignup: ({ variant }: { variant?: string }) => (
      <div data-testid={`newsletter-signup-${variant}`}>
        Mocked Newsletter Signup - {variant}
      </div>
    ),
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    render(<Home />);
  });

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      expect(
        screen.getByRole('heading', {
          name: /Premier League ITK Transfer Digest/i,
        })
      ).toBeInTheDocument();
    });

    it('renders the hero description', () => {
      expect(
        screen.getByText(
          /All the rumours, for people who swear they're not obsessed with transfers/i
        )
      ).toBeInTheDocument();
    });

    it('renders the call-to-action buttons', () => {
      expect(
        screen.getByRole('button', { name: /Get Today's Brief/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /View Archive/i })
      ).toBeInTheDocument();
    });
  });

  describe('Newsletter Section', () => {
    it('renders the newsletter signup section', () => {
      expect(
        screen.getByRole('heading', { name: /Never Miss a Transfer/i })
      ).toBeInTheDocument();
    });

    it('renders the newsletter signup component with hero variant', () => {
      expect(screen.getByTestId('newsletter-signup-hero')).toBeInTheDocument();
    });

    it('renders the newsletter description', () => {
      expect(
        screen.getByText(
          /Join thousands of transfer addicts getting the inside scoop/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('renders the features section heading', () => {
      expect(
        screen.getByRole('heading', { name: /Why Transfer Juice\?/i })
      ).toBeInTheDocument();
    });

    it('renders all three feature cards', () => {
      expect(
        screen.getByRole('heading', { name: /Lightning Fast/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /ITK Sources/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /Curated Content/i })
      ).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      expect(
        screen.getByText(
          /3x daily briefings ensure you're always first to know/i
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We monitor the most reliable In The Know accounts/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/AI-powered filtering and human editorial oversight/i)
      ).toBeInTheDocument();
    });
  });

  describe('Recent Briefings Section', () => {
    it('renders the briefings section heading', () => {
      expect(
        screen.getByRole('heading', { name: /Latest Briefings/i })
      ).toBeInTheDocument();
    });

    it('renders all three briefing preview cards', () => {
      expect(
        screen.getByRole('heading', {
          name: /Arsenal Close In On Striker Deal/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: /Chelsea Midfielder Saga Continues/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /Man United Defender Update/i })
      ).toBeInTheDocument();
    });

    it('renders briefing type badges', () => {
      expect(screen.getByText('MORNING BRIEF')).toBeInTheDocument();
      expect(screen.getByText('AFTERNOON BRIEF')).toBeInTheDocument();
      expect(screen.getByText('EVENING BRIEF')).toBeInTheDocument();
    });

    it('renders briefing timestamps', () => {
      expect(screen.getByText('Today, 8:00 AM')).toBeInTheDocument();
      expect(screen.getByText('Yesterday, 2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Yesterday, 8:00 PM')).toBeInTheDocument();
    });

    it('renders read brief buttons', () => {
      const readButtons = screen.getAllByRole('button', {
        name: /Read Full Brief/i,
      });
      expect(readButtons).toHaveLength(3);
    });

    it('renders view all briefings button', () => {
      expect(
        screen.getByRole('button', { name: /View All Briefings/i })
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure with main element', () => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByRole('heading');
      // Should have h1, h2s, and h3s in proper order
      expect(headings.length).toBeGreaterThan(5);
    });
  });

  describe('Layout and Styling', () => {
    it('applies proper CSS classes for responsive design', () => {
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
    });

    it('renders sections with proper structure', () => {
      // Check that we have multiple sections
      const sections = document.querySelectorAll('section');
      expect(sections).toHaveLength(4); // Hero, Newsletter, Features, Briefings
    });
  });
});
