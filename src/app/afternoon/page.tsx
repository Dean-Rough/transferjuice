import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AfternoonBriefPage() {
  return (
    <main className='flex-1'>
      <Container className='py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <span className='text-xs font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full mb-4 inline-block'>
              AFTERNOON BRIEF
            </span>
            <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
              Midday Madness: Transfer Updates
            </h1>
            <p className='text-lg text-dark-text-muted'>
              The transfer window heats up as deals develop and rumors swirl
              across Premier League clubs.
            </p>
            <div className='text-sm text-dark-text-muted mt-2'>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              • 2:00 PM BST
            </div>
          </div>

          {/* Content Coming Soon */}
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle>Development in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-dark-text-muted mb-6'>
                The afternoon briefing will capture the peak transfer activity
                hours when clubs are most active and ITK sources are dropping
                their hottest takes. Perfect for your lunch break transfer fix.
              </p>
              <div className='grid md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <h4 className='font-semibold text-dark-text-primary'>
                    Typical Coverage:
                  </h4>
                  <ul className='space-y-2 text-sm text-dark-text-secondary'>
                    <li>• Live developing transfer situations</li>
                    <li>• Medical and contract updates</li>
                    <li>• Agent activity and negotiations</li>
                    <li>• Press conference highlights</li>
                  </ul>
                </div>
                <div className='space-y-3'>
                  <h4 className='font-semibold text-dark-text-primary'>
                    Premium Sources:
                  </h4>
                  <ul className='space-y-2 text-sm text-dark-text-secondary'>
                    <li>• Fabrizio Romano breaking news</li>
                    <li>• BBC Sport journalist updates</li>
                    <li>• Athletic insider reports</li>
                    <li>• Club tier-1 source confirmations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Story Structure */}
          <Card>
            <CardContent className='p-8'>
              <h2 className='text-2xl font-bold text-dark-text-primary mb-6'>
                Sample Afternoon Brief Structure
              </h2>
              <div className='space-y-6'>
                <div className='border-l-4 border-blue-500 pl-6'>
                  <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                    🔥 Breaking: Major Development
                  </h3>
                  <p className='text-dark-text-secondary text-sm'>
                    The biggest story of the day gets the full Terry treatment -
                    complete with context, reliability analysis, and just enough
                    sarcasm to make transfer chaos entertaining.
                  </p>
                </div>

                <div className='border-l-4 border-brand-orange-500 pl-6'>
                  <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                    📈 Rumour Tracker
                  </h3>
                  <p className='text-dark-text-secondary text-sm'>
                    Multiple ongoing stories tracked with reliability scores and
                    timeline updates. No more wondering which rumors actually
                    matter.
                  </p>
                </div>

                <div className='border-l-4 border-purple-500 pl-6'>
                  <h3 className='text-lg font-semibold text-dark-text-primary mb-2'>
                    🎯 Club Focus
                  </h3>
                  <p className='text-dark-text-secondary text-sm'>
                    Deep dive into one club&apos;s transfer activity with
                    insider knowledge and strategic analysis of their window
                    priorities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='text-center mt-12'>
            <div className='space-y-4'>
              <Button size='lg' className='w-full sm:w-auto'>
                Get Notified When Live
              </Button>
              <div className='block sm:inline-block sm:ml-4'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:w-auto'
                >
                  Browse Morning Briefs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
