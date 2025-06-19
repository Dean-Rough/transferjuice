'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { Button } from '../ui/Button';

interface NavigationItem {
  name: string;
  href: string;
  description?: string;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/' },
  {
    name: 'Morning Brief',
    href: '/morning',
    description: 'Latest morning transfer updates',
  },
  {
    name: 'Afternoon Brief',
    href: '/afternoon',
    description: 'Midday transfer roundup',
  },
  {
    name: 'Evening Brief',
    href: '/evening',
    description: 'End of day transfer digest',
  },
  { name: 'Archive', href: '/archive', description: 'Previous briefings' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className='sticky top-0 z-50 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md'>
      <Container>
        <nav
          className='flex items-center justify-between py-4'
          aria-label='Global navigation'
        >
          {/* Logo */}
          <div className='flex lg:flex-1'>
            <Link href='/' className='-m-1.5 p-1.5 group'>
              <span className='sr-only'>Transfer Juice</span>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-orange-gradient rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-200'>
                  <span className='text-brand-black font-black text-lg'>
                    TJ
                  </span>
                </div>
                <span className='text-xl font-black text-dark-text-primary group-hover:text-brand-orange-500 transition-colors duration-200'>
                  Transfer Juice
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className='flex lg:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label='Toggle navigation menu'
            >
              <span className='sr-only'>Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              ) : (
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='1.5'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                  />
                </svg>
              )}
            </Button>
          </div>

          {/* Desktop navigation */}
          <div className='hidden lg:flex lg:gap-x-8'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className='text-sm font-semibold leading-6 text-dark-text-secondary hover:text-brand-orange-500 transition-colors duration-200'
                title={item.description}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className='hidden lg:flex lg:flex-1 lg:justify-end'>
            <Link href='#newsletter'>
              <Button size='sm'>Subscribe</Button>
            </Link>
          </div>
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className='lg:hidden'>
            <div className='space-y-2 py-6 border-t border-dark-border'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-dark-text-secondary hover:bg-dark-surface hover:text-brand-orange-500 transition-all duration-200'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div>
                    <div>{item.name}</div>
                    {item.description && (
                      <div className='text-sm text-dark-text-muted mt-1'>
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              <div className='pt-4'>
                <Link
                  href='#newsletter'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className='w-full'>Subscribe to Newsletter</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
