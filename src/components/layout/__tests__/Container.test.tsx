import { render, screen, fireEvent } from '@testing-library/react';
import { Container } from '../Container';

describe('Container', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<Container data-testid='container'>Content</Container>);

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto', 'w-full');
      expect(container).toHaveTextContent('Content');
    });

    it('applies default size and padding', () => {
      render(<Container data-testid='container'>Content</Container>);

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-7xl', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Size Variants', () => {
    it('renders small size', () => {
      render(
        <Container size='sm' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-3xl');
    });

    it('renders medium size', () => {
      render(
        <Container size='md' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-5xl');
    });

    it('renders large size (default)', () => {
      render(
        <Container size='lg' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-7xl');
    });

    it('renders extra large size', () => {
      render(
        <Container size='xl' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-8xl');
    });

    it('renders full width size', () => {
      render(
        <Container size='full' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-full');
    });
  });

  describe('Padding Variants', () => {
    it('renders no padding', () => {
      render(
        <Container padding='none' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).not.toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('renders small padding', () => {
      render(
        <Container padding='sm' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('px-4', 'sm:px-6');
      expect(container).not.toHaveClass('lg:px-8');
    });

    it('renders medium padding (default)', () => {
      render(
        <Container padding='md' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('renders large padding', () => {
      render(
        <Container padding='lg' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('px-6', 'sm:px-8', 'lg:px-12');
    });
  });

  describe('Variant Combinations', () => {
    it('combines size and padding variants correctly', () => {
      render(
        <Container size='sm' padding='sm' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-3xl'); // sm size
      expect(container).toHaveClass('px-4', 'sm:px-6'); // sm padding
    });

    it('handles full width with no padding', () => {
      render(
        <Container size='full' padding='none' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-full');
      expect(container).not.toHaveClass('px-4', 'px-6', 'px-8');
    });

    it('handles large size with large padding', () => {
      render(
        <Container size='xl' padding='lg' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-8xl'); // xl size
      expect(container).toHaveClass('px-6', 'sm:px-8', 'lg:px-12'); // lg padding
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(
        <Container className='custom-container' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('custom-container');
    });

    it('combines custom className with variant classes', () => {
      render(
        <Container
          size='sm'
          padding='lg'
          className='custom-class bg-red-500'
          data-testid='container'
        >
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-3xl'); // sm size
      expect(container).toHaveClass('px-6', 'sm:px-8', 'lg:px-12'); // lg padding
      expect(container).toHaveClass('custom-class', 'bg-red-500'); // custom classes
    });
  });

  describe('HTML Attributes', () => {
    it('forwards HTML div attributes', () => {
      render(
        <Container
          data-testid='container'
          role='main'
          aria-label='Main container'
          id='main-container'
        >
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('role', 'main');
      expect(container).toHaveAttribute('aria-label', 'Main container');
      expect(container).toHaveAttribute('id', 'main-container');
    });

    it('supports event handlers', () => {
      const handleClick = jest.fn();
      const handleMouseEnter = jest.fn();

      render(
        <Container
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          data-testid='container'
        >
          Content
        </Container>
      );

      const container = screen.getByTestId('container');

      container.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.mouseEnter(container);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ref Forwarding', () => {
    it('supports ref forwarding', () => {
      const ref = jest.fn();
      render(<Container ref={ref}>Content</Container>);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('allows ref access to DOM methods', () => {
      let containerRef: HTMLDivElement | null = null;

      render(
        <Container
          ref={(el) => {
            containerRef = el;
          }}
          data-testid='container'
        >
          Content
        </Container>
      );

      expect(containerRef).toBeInstanceOf(HTMLDivElement);
      expect(containerRef?.textContent).toBe('Content');
    });
  });

  describe('Content Handling', () => {
    it('renders simple text content', () => {
      render(<Container>Simple text</Container>);

      expect(screen.getByText('Simple text')).toBeInTheDocument();
    });

    it('renders complex JSX content', () => {
      render(
        <Container>
          <h1>Title</h1>
          <p>Paragraph</p>
          <div>
            <span>Nested content</span>
          </div>
        </Container>
      );

      expect(
        screen.getByRole('heading', { name: 'Title' })
      ).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('handles empty content', () => {
      render(<Container data-testid='container'></Container>);

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('handles multiple children', () => {
      render(
        <Container>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </Container>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive padding classes', () => {
      render(
        <Container padding='md' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      // Check that responsive classes are applied
      expect(container).toHaveClass('px-4'); // base
      expect(container).toHaveClass('sm:px-6'); // small screens
      expect(container).toHaveClass('lg:px-8'); // large screens
    });

    it('handles responsive class structure for large padding', () => {
      render(
        <Container padding='lg' data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('px-6'); // base
      expect(container).toHaveClass('sm:px-8'); // small screens
      expect(container).toHaveClass('lg:px-12'); // large screens
    });
  });

  describe('Layout Integration', () => {
    it('works as a layout container', () => {
      render(
        <div>
          <header>
            <Container>
              <nav>Navigation</nav>
            </Container>
          </header>
          <main>
            <Container data-testid='main-container'>
              <h1>Main Content</h1>
              <p>Page content goes here</p>
            </Container>
          </main>
          <footer>
            <Container>
              <p>Footer content</p>
            </Container>
          </footer>
        </div>
      );

      const mainContainer = screen.getByTestId('main-container');
      expect(mainContainer).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Main Content' })
      ).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('maintains proper nesting structure', () => {
      render(
        <Container data-testid='outer'>
          <div>
            <Container data-testid='inner' size='sm'>
              Nested container
            </Container>
          </div>
        </Container>
      );

      const outer = screen.getByTestId('outer');
      const inner = screen.getByTestId('inner');

      expect(outer).toContainElement(inner);
      expect(outer).toHaveClass('max-w-7xl'); // default lg
      expect(inner).toHaveClass('max-w-3xl'); // sm size
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined className gracefully', () => {
      render(
        <Container className={undefined} data-testid='container'>
          Content
        </Container>
      );

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto', 'w-full');
    });

    it('handles null children gracefully', () => {
      render(<Container data-testid='container'>{null}</Container>);

      const container = screen.getByTestId('container');
      expect(container).toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('handles conditional content', () => {
      const showContent = true;

      render(
        <Container data-testid='container'>
          {showContent && <div>Conditional content</div>}
          {!showContent && <div>Alternative content</div>}
        </Container>
      );

      expect(screen.getByText('Conditional content')).toBeInTheDocument();
      expect(screen.queryByText('Alternative content')).not.toBeInTheDocument();
    });
  });
});
