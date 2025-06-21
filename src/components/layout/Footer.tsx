import Link from 'next/link';
import Image from 'next/image';
// import { Container } from './Container.simple';

const footerNavigation = {
  briefings: [
    { name: 'Morning Brief', href: '/morning' },
    { name: 'Afternoon Brief', href: '/afternoon' },
    { name: 'Evening Brief', href: '/evening' },
    { name: 'Archive', href: '/archive' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  social: [
    {
      name: 'Twitter',
      href: '#',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill='currentColor' viewBox='0 0 24 24' {...props}>
          <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
        </svg>
      ),
    },
  ],
};

export function Footer() {
  return (
    <footer
      className='bg-background border-t border-border'
      aria-labelledby='footer-heading'
    >
      <h2 id='footer-heading' className='sr-only'>
        Footer
      </h2>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className='py-16 lg:py-20'>
          <div className='xl:grid xl:grid-cols-3 xl:gap-8'>
            {/* Brand section */}
            <div className='space-y-8'>
              <div className='h-10'>
                <Image
                  src='/transfer-logo-white.svg'
                  alt='Transfer Juice'
                  width={200}
                  height={40}
                  className='h-full w-auto'
                />
              </div>
              <p className='text-base text-muted-foreground max-w-md'>
                Live global football transfer feed. Terry&apos;s ascerbic commentary
                on ITK chaos from Fabrizio Romano to your local wind-up
                merchant.
              </p>
              <div className='flex space-x-6'>
                {footerNavigation.social.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className='text-muted-foreground hover:text-orange-500 transition-colors duration-200'
                  >
                    <span className='sr-only'>{item.name}</span>
                    <item.icon className='h-6 w-6' aria-hidden='true' />
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation sections */}
            <div className='mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0'>
              <div className='md:grid md:grid-cols-2 md:gap-8'>
                <div>
                  <h3 className='engagement-mono font-semibold leading-6 text-foreground tracking-wide'>
                    FEEDS
                  </h3>
                  <ul role='list' className='mt-6 space-y-4'>
                    {footerNavigation.briefings.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className='text-sm leading-6 text-muted-foreground hover:text-orange-500 transition-colors duration-200'
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='mt-10 md:mt-0'>
                  <h3 className='engagement-mono font-semibold leading-6 text-foreground tracking-wide'>
                    COMPANY
                  </h3>
                  <ul role='list' className='mt-6 space-y-4'>
                    {footerNavigation.company.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className='text-sm leading-6 text-muted-foreground hover:text-orange-500 transition-colors duration-200'
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className='mt-16 border-t border-border pt-8 sm:mt-20 lg:mt-24'>
            <div className='md:flex md:items-center md:justify-between'>
              <div className='flex space-x-6 md:order-2'>
                <p className='text-xs leading-5 text-muted-foreground engagement-mono'>
                  Built with Next.js, TailwindCSS, and Terry&apos;s cynicism.
                </p>
              </div>
              <p className='mt-8 text-xs leading-5 text-muted-foreground engagement-mono md:order-1 md:mt-0'>
                &copy; 2024 Transfer Juice. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
