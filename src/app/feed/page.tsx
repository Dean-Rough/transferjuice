import { Container } from '@/components/layout/Container';
import { BriefingCard } from '@/components/features/BriefingCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Mock data - in production this would come from your API/CMS
const mockBriefings = [
  {
    id: '1',
    type: 'morning' as const,
    date: '2024-06-19',
    time: '08:00',
    title: 'Arsenal Close In On Striker Deal',
    content: `
      <p>Multiple ITK sources suggest Arsenal are in advanced talks for a January striker signing, with medical scheduled for this weekend.</p>
      
      <h3>Key Developments:</h3>
      <ul>
        <li><strong>09:15</strong> - First reports from @ArsenalITK suggesting "medical booked"</li>
        <li><strong>10:30</strong> - @ReliableGooner confirms Arsenal have submitted final bid</li>
        <li><strong>11:45</strong> - Player's agent spotted at London Colney training ground</li>
      </ul>
      
      <p>The 24-year-old striker has been Arsenal's primary target since the summer window, with Arteta personally pushing for the deal. Fee expected to be around £45m plus add-ons.</p>
      
      <blockquote>"This is the signing that could transform our season. Clinical finisher who fits our system perfectly." - Source close to Arsenal hierarchy</blockquote>
    `,
    image: '/api/placeholder/600/300',
    clubs: ['Arsenal', 'Brighton'],
    players: ['Evan Ferguson'],
    tags: ['Striker', 'Medical', 'January'],
    updates: [
      {
        time: '09:15',
        content: 'Medical reportedly scheduled for this weekend',
      },
      {
        time: '10:30',
        content: 'Final bid submitted, waiting for club response',
      },
      { time: '11:45', content: 'Agent spotted at training ground' },
    ],
  },
  {
    id: '2',
    type: 'afternoon' as const,
    date: '2024-06-19',
    time: '14:00',
    title: 'Chelsea Midfielder Saga Update',
    content: `
      <p>Fresh developments in Chelsea's pursuit of their primary midfield target as negotiations enter crucial phase.</p>
      
      <h3>Latest Updates:</h3>
      <ul>
        <li><strong>13:20</strong> - Personal terms agreed according to @ChelseaReliable</li>
        <li><strong>13:45</strong> - Clubs remain €10m apart on valuation</li>
        <li><strong>14:15</strong> - Player's preference is Chelsea move</li>
      </ul>
      
      <p>The 26-year-old has been Pochettino's top target to strengthen the midfield. Deal could be completed within 48 hours if clubs find middle ground on fee structure.</p>
    `,
    image: '/api/placeholder/600/300',
    clubs: ['Chelsea', 'Benfica'],
    players: ['Enzo Fernandez'],
    tags: ['Midfielder', 'Negotiations', 'Personal Terms'],
    updates: [
      { time: '13:20', content: 'Personal terms reportedly agreed' },
      { time: '13:45', content: 'Clubs still negotiating final fee structure' },
      { time: '14:15', content: 'Player keen on Chelsea move' },
    ],
  },
  {
    id: '3',
    type: 'evening' as const,
    date: '2024-06-18',
    time: '20:00',
    title: 'Man United Defensive Reinforcement',
    content: `
      <p>Surprising twist in United's pursuit of defensive reinforcements as new candidate emerges from Serie A.</p>
      
      <h3>Breaking Updates:</h3>
      <ul>
        <li><strong>19:30</strong> - United scouts watched player in midweek fixture</li>
        <li><strong>19:45</strong> - Initial contact made with player's representatives</li>
        <li><strong>20:15</strong> - Serie A club open to January sale for right price</li>
      </ul>
      
      <p>Ten Hag reportedly impressed by the defender's Champions League performances this season. Could be alternative to primary target if negotiations stall.</p>
    `,
    image: '/api/placeholder/600/300',
    clubs: ['Man United', 'AC Milan'],
    players: ['Fikayo Tomori'],
    tags: ['Defender', 'Serie A', 'Scouts'],
    updates: [
      { time: '19:30', content: 'Scouts present at latest match' },
      { time: '19:45', content: 'Contact established with representatives' },
      { time: '20:15', content: 'Club open to negotiations' },
    ],
  },
];

export default function FeedPage() {
  return (
    <div className='py-12'>
      <Container>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
            Live Transfer Feed
          </h1>
          <p className='text-lg text-dark-text-muted max-w-2xl mx-auto'>
            Real-time updates from the most reliable ITK sources. Updated 3x
            daily with breaking developments.
          </p>
        </div>

        {/* Live indicator */}
        <div className='flex items-center justify-center mb-8'>
          <div className='flex items-center space-x-2 bg-dark-surface border border-dark-border rounded-full px-4 py-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-mono text-dark-text-muted tracking-wide'>
              LIVE • Last updated: Today 14:15
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className='flex justify-center mb-12'>
          <div className='inline-flex rounded-lg bg-dark-surface p-1 border border-dark-border'>
            <button className='px-6 py-2 text-sm font-mono font-semibold rounded-md bg-brand-orange-500 text-brand-black tracking-wide'>
              ALL
            </button>
            <button className='px-6 py-2 text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              MORNING
            </button>
            <button className='px-6 py-2 text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              AFTERNOON
            </button>
            <button className='px-6 py-2 text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              EVENING
            </button>
          </div>
        </div>

        {/* Feed content */}
        <div className='max-w-4xl mx-auto space-y-8'>
          {mockBriefings.map((briefing) => (
            <BriefingCard key={briefing.id} briefing={briefing} />
          ))}
        </div>

        {/* Load more */}
        <div className='text-center mt-12'>
          <Button variant='outline' size='lg'>
            Load More Briefings
          </Button>
        </div>
      </Container>
    </div>
  );
}
