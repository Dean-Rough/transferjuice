import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ArchivePage() {
  return (
    <main className='flex-1'>
      <Container className='py-12'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
              Transfer Juice Archive
            </h1>
            <p className='text-lg text-dark-text-muted max-w-3xl mx-auto'>
              Browse the complete collection of Transfer Juice briefings. Every
              rumour, every deal, every moment of transfer window madness - all
              archived for your browsing pleasure.
            </p>
          </div>

          {/* Filter Navigation */}
          <div className='flex flex-wrap gap-4 justify-center mb-12'>
            <Button
              variant='outline'
              size='sm'
              className='border-brand-orange-500 text-brand-orange-500'
            >
              All Briefings
            </Button>
            <Button variant='ghost' size='sm'>
              Morning Brief
            </Button>
            <Button variant='ghost' size='sm'>
              Afternoon Brief
            </Button>
            <Button variant='ghost' size='sm'>
              Evening Brief
            </Button>
            <Button variant='ghost' size='sm'>
              This Week
            </Button>
            <Button variant='ghost' size='sm'>
              This Month
            </Button>
          </div>

          {/* Archive Coming Soon */}
          <Card className='mb-12'>
            <CardHeader>
              <CardTitle>Archive Under Construction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center space-y-6'>
                <div className='w-24 h-24 bg-gradient-to-br from-brand-orange-500 to-brand-orange-600 rounded-3xl flex items-center justify-center mx-auto'>
                  <svg
                    className='w-12 h-12 text-brand-black'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                    />
                  </svg>
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-dark-text-primary mb-4'>
                    Building Your Transfer Library
                  </h2>
                  <p className='text-dark-text-muted mb-6 max-w-2xl mx-auto'>
                    The archive will be your complete searchable database of
                    Transfer Juice content. Every briefing will be catalogued,
                    tagged, and made easily discoverable so you can relive the
                    best transfer moments or track how stories developed over
                    time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Future Features Preview */}
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-blue-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                  Smart Search
                </h3>
                <p className='text-dark-text-muted text-sm'>
                  Find specific transfers, clubs, or players across all
                  briefings with intelligent search and filtering.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6 text-center'>
                <div className='w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-purple-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                  Topic Tags
                </h3>
                <p className='text-dark-text-muted text-sm'>
                  Browse by transfer themes: completed deals, collapsed moves,
                  deadline day chaos, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6 text-center'>
                <div className='w-16 h-16 bg-brand-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <svg
                    className='w-8 h-8 text-brand-orange-500'
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
                <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                  Timeline View
                </h3>
                <p className='text-dark-text-muted text-sm'>
                  See how transfer sagas unfolded over time with chronological
                  story tracking and updates.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sample Archive Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Archive Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {/* Sample Archive Entry */}
                <div className='border border-dark-border rounded-lg p-4 hover:border-brand-orange-500/50 transition-colors'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-xs font-medium text-brand-orange-500 bg-brand-orange-500/10 px-2 py-1 rounded'>
                        MORNING BRIEF
                      </span>
                      <span className='text-xs text-dark-text-muted'>
                        Today, 8:00 AM
                      </span>
                    </div>
                    <Button variant='ghost' size='sm'>
                      Read →
                    </Button>
                  </div>
                  <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                    Arsenal Close In On Striker Deal (Sample)
                  </h3>
                  <p className='text-dark-text-muted text-sm mb-3'>
                    Multiple ITK sources suggest Arsenal are in advanced talks
                    for a January striker signing, with medical scheduled for
                    this weekend according to...
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      Arsenal
                    </span>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      Striker
                    </span>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      January Window
                    </span>
                  </div>
                </div>

                <div className='border border-dark-border rounded-lg p-4 hover:border-brand-orange-500/50 transition-colors'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded'>
                        AFTERNOON BRIEF
                      </span>
                      <span className='text-xs text-dark-text-muted'>
                        Yesterday, 2:00 PM
                      </span>
                    </div>
                    <Button variant='ghost' size='sm'>
                      Read →
                    </Button>
                  </div>
                  <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                    Chelsea Midfielder Saga Continues (Sample)
                  </h3>
                  <p className='text-dark-text-muted text-sm mb-3'>
                    Fresh developments in the ongoing Chelsea midfield pursuit
                    as negotiations enter a crucial phase with personal terms
                    reportedly...
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      Chelsea
                    </span>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      Midfielder
                    </span>
                    <span className='text-xs bg-dark-surface px-2 py-1 rounded text-dark-text-muted'>
                      Negotiations
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='text-center mt-12'>
            <Button size='lg' className='w-full sm:w-auto'>
              Get Notified When Archive Goes Live
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
