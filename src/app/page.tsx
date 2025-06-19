import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { NewsletterSignup } from '@/components/features/NewsletterSignup';
import Link from 'next/link';

// Mock transfer feed data
const mockTransfers = [
  {
    id: '1',
    playerName: 'Kylian Mbappé',
    fromClub: 'PSG',
    toClub: 'Arsenal',
    fee: '£180m',
    status: 'rumoured',
    tier: 'tier2',
    timeAgo: '2h ago',
    summary:
      'Arsenal exploring possibility of record-breaking move for French forward',
  },
  {
    id: '2',
    playerName: 'Erling Haaland',
    fromClub: 'Manchester City',
    toClub: 'Chelsea',
    fee: '£200m',
    status: 'close',
    tier: 'tier1',
    timeAgo: '4h ago',
    summary: 'Chelsea in advanced talks, medical could be scheduled this week',
  },
  {
    id: '3',
    playerName: 'Marcus Rashford',
    fromClub: 'Manchester United',
    toClub: 'Tottenham',
    fee: '£80m',
    status: 'bid_submitted',
    tier: 'tier3',
    timeAgo: '6h ago',
    summary: 'Spurs submit formal £80m bid for England forward',
  },
  {
    id: '4',
    playerName: 'Evan Ferguson',
    fromClub: 'Brighton',
    toClub: 'Arsenal',
    fee: '£45m',
    status: 'confirmed',
    tier: 'tier1',
    timeAgo: '1d ago',
    summary: 'Deal officially completed, player undergoes medical',
  },
];

const statusColors = {
  rumoured: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  close: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  bid_submitted: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const tierColors = {
  tier1: 'bg-green-500/10 text-green-600 dark:text-green-400',
  tier2: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  tier3: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

export default function Home() {
  return (
    <>
      {/* Compact Header */}
      <section className='py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'>
        <Container>
          <div className='text-center'>
            <h1 className='text-3xl md:text-4xl font-black text-gray-900 dark:text-gray-50 mb-2'>
              Transfer Feed
            </h1>
            <p className='text-gray-600 dark:text-gray-400 text-lg'>
              Latest Premier League transfer news and rumours
            </p>
          </div>
        </Container>
      </section>

      {/* Main Transfer Feed */}
      <section className='py-12'>
        <Container>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Main Feed Column */}
            <div className='lg:col-span-3 space-y-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-50'>
                  Latest Updates
                </h2>
                <div className='flex space-x-2'>
                  <Button size='sm' variant='outline'>
                    All
                  </Button>
                  <Button size='sm' variant='ghost'>
                    Tier 1
                  </Button>
                  <Button size='sm' variant='ghost'>
                    Confirmed
                  </Button>
                </div>
              </div>

              {/* Transfer Feed Items */}
              {mockTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3 mb-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-mono ${statusColors[transfer.status as keyof typeof statusColors]}`}
                          >
                            {transfer.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-mono ${tierColors[transfer.tier as keyof typeof tierColors]}`}
                          >
                            {transfer.tier.toUpperCase()}
                          </span>
                          <span className='text-xs text-gray-500 dark:text-gray-400'>
                            {transfer.timeAgo}
                          </span>
                        </div>
                        <h3 className='text-lg font-bold text-gray-900 dark:text-gray-50 mb-2'>
                          {transfer.playerName}
                          <span className='mx-2 text-orange-500'>→</span>
                          {transfer.toClub}
                        </h3>
                        <div className='flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3'>
                          <span>
                            From:{' '}
                            <span className='font-semibold'>
                              {transfer.fromClub}
                            </span>
                          </span>
                          <span>
                            Fee:{' '}
                            <span className='font-semibold text-green-500'>
                              {transfer.fee}
                            </span>
                          </span>
                        </div>
                        <p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
                          {transfer.summary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className='text-center pt-8'>
                <Button variant='outline'>Load More Updates</Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className='lg:col-span-1 space-y-6'>
              {/* Newsletter Signup - Compact */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    Never Miss a Transfer
                  </CardTitle>
                  <CardDescription>
                    Get insider knowledge delivered 3x daily
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NewsletterSignup variant='compact' />
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Link
                    href='/rumoured'
                    className='block text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors'
                  >
                    → Rumoured Transfers
                  </Link>
                  <Link
                    href='/confirmed'
                    className='block text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors'
                  >
                    → Confirmed Deals
                  </Link>
                  <Link
                    href='/weekly'
                    className='block text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors'
                  >
                    → This Week's Activity
                  </Link>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>
                    About Transfer Juice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                    We monitor the most reliable ITK sources to bring you
                    Premier League transfer news without the noise.
                  </p>
                  <div className='mt-4 space-y-2'>
                    <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                      <span className='w-2 h-2 bg-green-400 rounded-full mr-2'></span>
                      3x daily briefings
                    </div>
                    <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                      <span className='w-2 h-2 bg-blue-400 rounded-full mr-2'></span>
                      AI-powered filtering
                    </div>
                    <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                      <span className='w-2 h-2 bg-orange-400 rounded-full mr-2'></span>
                      Tier-rated sources
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
