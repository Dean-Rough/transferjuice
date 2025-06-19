import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function MorningBriefPage() {
  return (
    <main className='flex-1'>
      <Container className='py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <span className='text-xs font-medium text-brand-orange-500 bg-brand-orange-500/10 px-3 py-1 rounded-full mb-4 inline-block'>
              MORNING BRIEF
            </span>
            <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
              Transfer Roundup: Morning Edition
            </h1>
            <p className='text-lg text-dark-text-muted'>
              Your daily dose of Premier League transfer chaos, served fresh
              with your coffee.
            </p>
            <div className='text-sm text-dark-text-muted mt-2'>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              • 8:00 AM BST
            </div>
          </div>

          {/* Content Coming Soon */}
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-dark-text-muted mb-6'>
                The Transfer Juice morning briefing is currently being
                developed. Our AI-powered pipeline will soon be delivering the
                freshest Premier League transfer news straight from the most
                reliable ITK sources.
              </p>
              <div className='space-y-4'>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 bg-brand-orange-500 rounded-full mt-2'></div>
                  <p className='text-sm text-dark-text-secondary'>
                    <strong>Morning Brief (8:00 AM):</strong> Overnight
                    developments and breaking transfer news
                  </p>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full mt-2'></div>
                  <p className='text-sm text-dark-text-secondary'>
                    <strong>Afternoon Brief (2:00 PM):</strong> Midday madness
                    and emerging stories
                  </p>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='w-2 h-2 bg-purple-500 rounded-full mt-2'></div>
                  <p className='text-sm text-dark-text-secondary'>
                    <strong>Evening Brief (8:00 PM):</strong> End-of-day roundup
                    and weekend prep
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Content Preview */}
          <Card>
            <CardContent className='p-8'>
              <h2 className='text-2xl font-bold text-dark-text-primary mb-6'>
                What to Expect
              </h2>
              <div className='prose-custom'>
                <p>
                  Each morning briefing will feature the ascerbic wit and sharp
                  observations that make transfer chaos actually entertaining.
                  We&apos;ll cut through the noise of Twitter ITK accounts to
                  bring you the stories that matter, delivered with the
                  editorial flair you can&apos;t get anywhere else.
                </p>
                <h3 className='text-xl font-semibold text-dark-text-primary mt-6 mb-3'>
                  Featured Content:
                </h3>
                <ul className='space-y-2 text-dark-text-secondary'>
                  <li>• Breaking overnight transfer developments</li>
                  <li>• Reliability ratings for ITK sources</li>
                  <li>• Contextual analysis of rumour patterns</li>
                  <li>• Club-by-club transfer activity summaries</li>
                  <li>• Weekend transfer window expectations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='text-center mt-12'>
            <div className='space-y-4'>
              <Button size='lg' className='w-full sm:w-auto'>
                Subscribe to Daily Briefings
              </Button>
              <div className='block sm:inline-block sm:ml-4'>
                <Button
                  variant='outline'
                  size='lg'
                  className='w-full sm:w-auto'
                >
                  View Previous Briefings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
