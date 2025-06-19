'use client';

import { useEffect, useRef } from 'react';

interface ParallaxSectionProps {
  children: React.ReactNode;
  backgroundImage: string;
  speed?: number; // 0.1 to 1.0, where 1.0 is no parallax effect
  className?: string;
  overlay?: 'light' | 'dark' | 'brand' | 'none';
  height?: 'screen' | 'half' | 'auto';
}

export function ParallaxSection({
  children,
  backgroundImage,
  speed = 0.5,
  className = '',
  overlay = 'dark',
  height = 'auto',
}: ParallaxSectionProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!parallaxRef.current) return;

          const scrolled = window.pageYOffset;
          const element = parallaxRef.current;
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrolled;
          const windowHeight = window.innerHeight;

          // Only apply parallax when element is in viewport
          if (
            scrolled + windowHeight > elementTop &&
            scrolled < elementTop + element.offsetHeight
          ) {
            const yPos = -(scrolled - elementTop) * speed;
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const overlayClasses = {
    light: 'bg-white/80',
    dark: 'bg-black/60',
    brand:
      'bg-gradient-to-br from-brand-orange-500/20 via-black/70 to-black/90',
    none: '',
  };

  const heightClasses = {
    screen: 'min-h-screen',
    half: 'min-h-[50vh]',
    auto: '',
  };

  return (
    <section
      className={`relative overflow-hidden ${heightClasses[height]} ${className}`}
    >
      {/* Parallax Background */}
      <div
        ref={parallaxRef}
        className='absolute inset-0 bg-cover bg-center bg-no-repeat parallax-container'
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      )}

      {/* Content */}
      <div className='relative z-10'>{children}</div>
    </section>
  );
}
