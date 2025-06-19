import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card data-testid='card'>Card content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass(
        'rounded-xl',
        'border',
        'transition-all',
        'duration-200'
      );
    });

    it('applies default variant and padding', () => {
      render(<Card data-testid='card'>Content</Card>);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-dark-surface', 'border-dark-border', 'p-6');
    });

    it('renders with elevated variant', () => {
      render(
        <Card variant='elevated' data-testid='card'>
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-xl', 'transform');
    });

    it('renders with glass variant', () => {
      render(
        <Card variant='glass' data-testid='card'>
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'backdrop-blur-md',
        'bg-white/5',
        'border-white/10'
      );
    });

    it('renders with outline variant', () => {
      render(
        <Card variant='outline' data-testid='card'>
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bg-transparent', 'border-dark-border');
    });

    it('applies different padding sizes', () => {
      const { rerender } = render(
        <Card padding='sm' data-testid='card'>
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('p-4');

      rerender(
        <Card padding='lg' data-testid='card'>
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('p-8');

      rerender(
        <Card padding='xl' data-testid='card'>
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).toHaveClass('p-10');

      rerender(
        <Card padding='none' data-testid='card'>
          Content
        </Card>
      );
      expect(screen.getByTestId('card')).not.toHaveClass(
        'p-4',
        'p-6',
        'p-8',
        'p-10'
      );
    });

    it('applies custom className', () => {
      render(
        <Card className='custom-class' data-testid='card'>
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards HTML attributes', () => {
      render(
        <Card
          data-testid='card'
          role='region'
          aria-label='Card section'
          id='custom-card'
        >
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Card section');
      expect(card).toHaveAttribute('id', 'custom-card');
    });

    it('supports ref forwarding', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Content</Card>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('CardHeader', () => {
    it('renders with default styling', () => {
      render(<CardHeader data-testid='header'>Header content</CardHeader>);

      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
      expect(header).toHaveTextContent('Header content');
    });

    it('applies custom className', () => {
      render(
        <CardHeader className='custom-header' data-testid='header'>
          Content
        </CardHeader>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards HTML attributes', () => {
      render(
        <CardHeader data-testid='header' role='banner'>
          Content
        </CardHeader>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveAttribute('role', 'banner');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 with default styling', () => {
      render(<CardTitle>Card Title</CardTitle>);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        'text-xl',
        'font-bold',
        'text-dark-text-primary'
      );
      expect(title).toHaveTextContent('Card Title');
    });

    it('applies custom className', () => {
      render(<CardTitle className='custom-title'>Title</CardTitle>);

      const title = screen.getByRole('heading');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards HTML attributes', () => {
      render(
        <CardTitle id='card-title' data-testid='title'>
          Title
        </CardTitle>
      );

      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('supports ref forwarding', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLHeadingElement));
    });
  });

  describe('CardDescription', () => {
    it('renders with default styling', () => {
      render(
        <CardDescription data-testid='description'>
          Card description text
        </CardDescription>
      );

      const description = screen.getByTestId('description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-dark-text-muted');
      expect(description).toHaveTextContent('Card description text');
    });

    it('applies custom className', () => {
      render(
        <CardDescription className='custom-desc' data-testid='description'>
          Description
        </CardDescription>
      );

      const description = screen.getByTestId('description');
      expect(description).toHaveClass('custom-desc');
    });

    it('forwards HTML attributes', () => {
      render(
        <CardDescription data-testid='description' role='note'>
          Description
        </CardDescription>
      );

      const description = screen.getByTestId('description');
      expect(description).toHaveAttribute('role', 'note');
    });
  });

  describe('CardContent', () => {
    it('renders with default styling', () => {
      render(<CardContent data-testid='content'>Card content</CardContent>);

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('pt-6');
      expect(content).toHaveTextContent('Card content');
    });

    it('applies custom className', () => {
      render(
        <CardContent className='custom-content' data-testid='content'>
          Content
        </CardContent>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards HTML attributes', () => {
      render(
        <CardContent data-testid='content' role='main'>
          Content
        </CardContent>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveAttribute('role', 'main');
    });
  });

  describe('CardFooter', () => {
    it('renders with default styling', () => {
      render(<CardFooter data-testid='footer'>Footer content</CardFooter>);

      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'pt-6');
      expect(footer).toHaveTextContent('Footer content');
    });

    it('applies custom className', () => {
      render(
        <CardFooter className='custom-footer' data-testid='footer'>
          Footer
        </CardFooter>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards HTML attributes', () => {
      render(
        <CardFooter data-testid='footer' role='contentinfo'>
          Footer
        </CardFooter>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveAttribute('role', 'contentinfo');
    });
  });

  describe('Card Component Integration', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid='card'>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      // Check all components are rendered
      const card = screen.getByTestId('card');
      const title = screen.getByRole('heading', { name: 'Test Card' });
      const description = screen.getByText('This is a test card description');
      const content = screen.getByText('This is the card content area');
      const button = screen.getByRole('button', { name: 'Action Button' });

      expect(card).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(button).toBeInTheDocument();

      // Check structure hierarchy
      expect(card).toContainElement(title);
      expect(card).toContainElement(description);
      expect(card).toContainElement(content);
      expect(card).toContainElement(button);
    });

    it('handles optional card sections', () => {
      render(
        <Card data-testid='minimal-card'>
          <CardContent>Just content, no header or footer</CardContent>
        </Card>
      );

      const card = screen.getByTestId('minimal-card');
      const content = screen.getByText('Just content, no header or footer');

      expect(card).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('handles empty card sections', () => {
      render(
        <Card data-testid='empty-card'>
          <CardHeader></CardHeader>
          <CardContent></CardContent>
          <CardFooter></CardFooter>
        </Card>
      );

      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();

      // Components should exist but be empty
      const sections = card.querySelectorAll('div');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('maintains proper spacing between sections', () => {
      render(
        <Card>
          <CardHeader data-testid='header'>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid='content'>Content</CardContent>
          <CardFooter data-testid='footer'>Footer</CardFooter>
        </Card>
      );

      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');

      expect(content).toHaveClass('pt-6');
      expect(footer).toHaveClass('pt-6');
    });
  });

  describe('Accessibility', () => {
    it('supports ARIA attributes', () => {
      render(
        <Card role='region' aria-labelledby='card-title' data-testid='card'>
          <CardHeader>
            <CardTitle id='card-title'>Accessible Card</CardTitle>
            <CardDescription>
              This card follows accessibility guidelines
            </CardDescription>
          </CardHeader>
          <CardContent>Card content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('card');
      const title = screen.getByRole('heading');

      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('supports semantic HTML structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Semantic Card</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
    });
  });
});
