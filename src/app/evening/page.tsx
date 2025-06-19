import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function EveningBriefPage() {
  return (
    <main className='flex-1'>
      <Container className='py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <span className='text-xs font-medium text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full mb-4 inline-block'>
              EVENING BRIEF
            </span>
            <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
              Day&apos;s End: Transfer Roundup
            </h1>
            <p className='text-lg text-dark-text-muted'>
              Wrap up the day&apos;s transfer developments with insight into
              what tomorrow might bring.
            </p>
            <div className='text-sm text-dark-text-muted mt-2'>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              • 8:00 PM BST
            </div>
          </div>

          {/* Content Coming Soon */}
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle>Evening Edition Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-dark-text-muted mb-6'>
                The evening brief will be your perfect end-of-day summary, tying
                together the day&apos;s transfer activity with forward-looking
                analysis for tomorrow. Think of it as your bedtime story, but
                with more transfer gossip and fewer fairy tales.
              </p>
              <div className='bg-dark-bg/50 rounded-lg p-6 border border-dark-border'>
                <h4 className='font-semibold text-dark-text-primary mb-4 flex items-center'>
                  <span className='w-2 h-2 bg-purple-500 rounded-full mr-3'></span>
                  Evening Brief Features
                </h4>
                <div className='grid sm:grid-cols-2 gap-4 text-sm text-dark-text-secondary'>
                  <div>
                    <h5 className='font-medium text-dark-text-primary mb-2'>
                      Today&apos;s Recap
                    </h5>
                    <ul className='space-y-1'>
                      <li>• Major deals completed</li>
                      <li>• Failed negotiations</li>
                      <li>• Surprise developments</li>
                      <li>• Club statements and reactions</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className='font-medium text-dark-text-primary mb-2'>
                      Tomorrow&apos;s Watch
                    </h5>
                    <ul className='space-y-1'>
                      <li>• Expected announcements</li>
                      <li>• Scheduled medicals</li>
                      <li>• Press conferences</li>
                      <li>• Deadline day preparations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Evening Brief Preview */}
          <Card className='mb-8'>
            <CardContent className='p-8'>
              <h2 className='text-2xl font-bold text-dark-text-primary mb-6'>
                What Makes Evening Briefs Special
              </h2>
              <div className='space-y-6'>
                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-purple-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                      Day-to-Day Context
                    </h3>
                    <p className='text-dark-text-secondary'>
                      Unlike morning chaos or afternoon madness, evening briefs
                      connect the dots. We&apos;ll show you how today&apos;s
                      rumours fit into longer transfer sagas and what patterns
                      are emerging across the Premier League.
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-brand-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-brand-orange-500'
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
                  <div>
                    <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                      Weekend Prep
                    </h3>
                    <p className='text-dark-text-secondary'>
                      Friday evening briefs will be especially crucial - setting
                      up the weekend&apos;s expected transfer activity and
                      identifying which stories to follow as clubs often save
                      their biggest announcements for maximum social media
                      impact.
                    </p>
                  </div>
                </div>

                <div className='flex items-start space-x-4'>
                  <div className='w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <svg
                      className='w-6 h-6 text-blue-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                      Terry&apos;s Hot Takes
                    </h3>
                    <p className='text-dark-text-secondary'>
                      Evening briefs will feature The Terry&apos;s most incisive
                      analysis - when there&apos;s time to properly dissect the
                      day&apos;s absurdities and deliver the kind of commentary
                      that makes transfer season actually entertaining.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='text-center mt-12'>
            <div className='space-y-4'>
              <Button size='lg' className='w-full sm:w-auto'>
                Subscribe for Evening Summaries
              </Button>
              <div className='block sm:inline-block sm:ml-4'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:w-auto'
                >
                  See All Daily Briefs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
