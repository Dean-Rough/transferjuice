import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { NewsletterSignup } from '@/components/features/NewsletterSignup';

export default function Home() {
  return (
    <main className='flex-1'>
      {/* Hero Section */}
      <section className='py-24 lg:py-32 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-brand-orange-500/5 via-transparent to-brand-orange-600/10' />
        <Container>
          <div className='relative z-10 text-center max-w-4xl mx-auto'>
            <h1 className='text-4xl md:text-6xl lg:text-7xl font-black text-dark-text-primary mb-6 leading-tight'>
              Premier League{' '}
              <span className='bg-orange-gradient bg-clip-text text-transparent'>
                ITK Transfer Digest
              </span>
            </h1>
            <p className='text-xl md:text-2xl text-dark-text-muted mb-8 max-w-3xl mx-auto leading-relaxed'>
              All the rumours, for people who swear they&apos;re not obsessed
              with transfers. Get insider knowledge delivered 3x daily.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Button size='xl' className='w-full sm:w-auto'>
                Get Today&apos;s Brief
              </Button>
              <Button variant='outline' size='xl' className='w-full sm:w-auto'>
                View Archive
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Newsletter Signup Section */}
      <section id='newsletter' className='py-20 lg:py-28 bg-dark-surface'>
        <Container>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-black text-dark-text-primary mb-4'>
              Never Miss a Transfer
            </h2>
            <p className='text-lg text-dark-text-muted max-w-2xl mx-auto'>
              Join thousands of transfer addicts getting the inside scoop on
              Premier League moves before they happen.
            </p>
          </div>
          <div className='max-w-2xl mx-auto'>
            <NewsletterSignup variant='hero' />
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className='py-20 lg:py-28'>
        <Container>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-black text-dark-text-primary mb-4'>
              Why Transfer Juice?
            </h2>
            <p className='text-lg text-dark-text-muted max-w-2xl mx-auto'>
              We cut through the noise to bring you the transfer news that
              actually matters.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card variant='elevated'>
              <CardContent className='p-8 text-center'>
                <div className='w-16 h-16 bg-orange-gradient rounded-2xl flex items-center justify-center mx-auto mb-6'>
                  <svg
                    className='w-8 h-8 text-brand-black'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-dark-text-primary mb-4'>
                  Lightning Fast
                </h3>
                <p className='text-dark-text-muted'>
                  3x daily briefings ensure you&apos;re always first to know
                  about the latest transfer developments.
                </p>
              </CardContent>
            </Card>

            <Card variant='elevated'>
              <CardContent className='p-8 text-center'>
                <div className='w-16 h-16 bg-orange-gradient rounded-2xl flex items-center justify-center mx-auto mb-6'>
                  <svg
                    className='w-8 h-8 text-brand-black'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-dark-text-primary mb-4'>
                  ITK Sources
                </h3>
                <p className='text-dark-text-muted'>
                  We monitor the most reliable In The Know accounts so you
                  don&apos;t have to scroll through Twitter all day.
                </p>
              </CardContent>
            </Card>

            <Card variant='elevated'>
              <CardContent className='p-8 text-center'>
                <div className='w-16 h-16 bg-orange-gradient rounded-2xl flex items-center justify-center mx-auto mb-6'>
                  <svg
                    className='w-8 h-8 text-brand-black'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-dark-text-primary mb-4'>
                  Curated Content
                </h3>
                <p className='text-dark-text-muted'>
                  AI-powered filtering and human editorial oversight ensure you
                  only get the juiciest transfer gossip.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Recent Briefings Preview */}
      <section className='py-20 lg:py-28 bg-dark-surface'>
        <Container>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-black text-dark-text-primary mb-4'>
              Latest Briefings
            </h2>
            <p className='text-lg text-dark-text-muted max-w-2xl mx-auto'>
              Catch up on the most recent transfer developments from our daily
              digest.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-xs font-medium text-brand-orange-500 bg-brand-orange-500/10 px-3 py-1 rounded-full'>
                    MORNING BRIEF
                  </span>
                  <span className='text-xs text-dark-text-muted'>
                    Today, 8:00 AM
                  </span>
                </div>
                <h3 className='text-lg font-bold text-dark-text-primary mb-3'>
                  Arsenal Close In On Striker Deal
                </h3>
                <p className='text-dark-text-muted mb-4 text-sm leading-relaxed'>
                  Multiple ITK sources suggest Arsenal are in advanced talks for
                  a January striker signing, with medical scheduled for...
                </p>
                <Button variant='ghost' size='sm' className='w-full'>
                  Read Full Brief →
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-xs font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full'>
                    AFTERNOON BRIEF
                  </span>
                  <span className='text-xs text-dark-text-muted'>
                    Yesterday, 2:00 PM
                  </span>
                </div>
                <h3 className='text-lg font-bold text-dark-text-primary mb-3'>
                  Chelsea Midfielder Saga Continues
                </h3>
                <p className='text-dark-text-muted mb-4 text-sm leading-relaxed'>
                  Fresh developments in the ongoing Chelsea midfield pursuit as
                  negotiations enter a crucial phase with personal terms...
                </p>
                <Button variant='ghost' size='sm' className='w-full'>
                  Read Full Brief →
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-xs font-medium text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full'>
                    EVENING BRIEF
                  </span>
                  <span className='text-xs text-dark-text-muted'>
                    Yesterday, 8:00 PM
                  </span>
                </div>
                <h3 className='text-lg font-bold text-dark-text-primary mb-3'>
                  Man United Defender Update
                </h3>
                <p className='text-dark-text-muted mb-4 text-sm leading-relaxed'>
                  Surprising twist in United&apos;s pursuit of defensive
                  reinforcements as new candidate emerges from Serie A with
                  impressive...
                </p>
                <Button variant='ghost' size='sm' className='w-full'>
                  Read Full Brief →
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className='text-center mt-12'>
            <Button variant='outline' size='lg'>
              View All Briefings
            </Button>
          </div>
        </Container>
      </section>
    </main>
  );
}
