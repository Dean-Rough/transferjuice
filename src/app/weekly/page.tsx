import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Mock data for 7-day summary
const weeklyHighlights = [
  {
    id: '1',
    date: '2024-06-19',
    dayOfWeek: 'Wednesday',
    tier: 'major' as const,
    title: 'Arsenal Complete £45m Ferguson Deal',
    summary:
      'Arsenal officially announced the signing of Brighton striker Evan Ferguson after a week of intense negotiations. The 21-year-old signed a 5-year contract.',
    impact: 'High',
    clubs: ['Arsenal', 'Brighton'],
    players: ['Evan Ferguson'],
    category: 'Confirmed',
  },
  {
    id: '2',
    date: '2024-06-18',
    dayOfWeek: 'Tuesday',
    tier: 'major' as const,
    title: 'Chelsea Close to Enzo Deal',
    summary:
      'Multiple sources confirm Chelsea have agreed personal terms with Enzo Fernandez. Only club-to-club negotiations remain.',
    impact: 'High',
    clubs: ['Chelsea', 'Benfica'],
    players: ['Enzo Fernandez'],
    category: 'Near Completion',
  },
  {
    id: '3',
    date: '2024-06-17',
    dayOfWeek: 'Monday',
    tier: 'moderate' as const,
    title: 'United Target Serie A Defender',
    summary:
      "Man United scouts watched Fikayo Tomori in AC Milan's Champions League match. Initial contact made with player representatives.",
    impact: 'Medium',
    clubs: ['Man United', 'AC Milan'],
    players: ['Fikayo Tomori'],
    category: 'Early Interest',
  },
  {
    id: '4',
    date: '2024-06-16',
    dayOfWeek: 'Sunday',
    tier: 'minor' as const,
    title: 'Liverpool Monitor Midfield Options',
    summary:
      'Liverpool added three midfielders to their summer shortlist according to reliable sources. No concrete moves yet.',
    impact: 'Low',
    clubs: ['Liverpool'],
    players: [],
    category: 'Scouting',
  },
  {
    id: '5',
    date: '2024-06-15',
    dayOfWeek: 'Saturday',
    tier: 'major' as const,
    title: 'Tottenham Hijack City Target',
    summary:
      "In a surprise twist, Tottenham submitted a higher bid for City's primary defensive target, throwing a spanner in the works.",
    impact: 'High',
    clubs: ['Tottenham', 'Man City', 'Newcastle'],
    players: ['Sven Botman'],
    category: 'Bidding War',
  },
  {
    id: '6',
    date: '2024-06-14',
    dayOfWeek: 'Friday',
    tier: 'moderate' as const,
    title: 'West Ham Eye Premier League Striker',
    summary:
      'West Ham have made initial enquiries for a proven Premier League striker as Moyes looks to strengthen his attack.',
    impact: 'Medium',
    clubs: ['West Ham', 'Wolves'],
    players: ['Matheus Cunha'],
    category: 'Initial Interest',
  },
  {
    id: '7',
    date: '2024-06-13',
    dayOfWeek: 'Thursday',
    tier: 'minor' as const,
    title: 'Championship Clubs Circle Arsenal Youth',
    summary:
      'Multiple Championship sides interested in Arsenal academy graduate on loan. Decision expected next week.',
    impact: 'Low',
    clubs: ['Arsenal', 'Norwich', 'Leeds'],
    players: ['Charlie Patino'],
    category: 'Loan Interest',
  },
];

const tierColors = {
  major: 'border-l-red-500 bg-red-500/5',
  moderate: 'border-l-yellow-500 bg-yellow-500/5',
  minor: 'border-l-blue-500 bg-blue-500/5',
};

const tierLabels = {
  major: 'MAJOR',
  moderate: 'MODERATE',
  minor: 'MINOR',
};

const impactColors = {
  High: 'text-red-400 bg-red-500/10',
  Medium: 'text-yellow-400 bg-yellow-500/10',
  Low: 'text-blue-400 bg-blue-500/10',
};

export default function WeeklyPage() {
  return (
    <div className='py-12'>
      <Container>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-black text-dark-text-primary mb-4'>
            Weekly Transfer Summary
          </h1>
          <p className='text-lg text-dark-text-muted max-w-2xl mx-auto'>
            The biggest transfer developments from the last 7 days. All the
            major moves, confirmations, and breaking news in one place.
          </p>
        </div>

        {/* Week selector */}
        <div className='flex justify-center mb-12'>
          <div className='inline-flex rounded-lg bg-dark-surface p-1 border border-dark-border'>
            <button className='px-6 py-2 text-sm font-mono font-semibold rounded-md bg-brand-orange-500 text-brand-black tracking-wide'>
              THIS WEEK
            </button>
            <button className='px-6 py-2 text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              LAST WEEK
            </button>
            <button className='px-6 py-2 text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              2 WEEKS AGO
            </button>
          </div>
        </div>

        {/* Impact filter */}
        <div className='flex justify-center mb-8'>
          <div className='flex space-x-2'>
            <span className='text-sm font-mono text-dark-text-muted tracking-wide'>
              FILTER BY IMPACT:
            </span>
            <button className='text-sm font-mono font-semibold text-red-400 hover:text-red-300 tracking-wide'>
              HIGH
            </button>
            <span className='text-dark-text-muted'>•</span>
            <button className='text-sm font-mono font-semibold text-yellow-400 hover:text-yellow-300 tracking-wide'>
              MEDIUM
            </button>
            <span className='text-dark-text-muted'>•</span>
            <button className='text-sm font-mono font-semibold text-blue-400 hover:text-blue-300 tracking-wide'>
              LOW
            </button>
            <span className='text-dark-text-muted'>•</span>
            <button className='text-sm font-mono font-semibold text-dark-text-muted hover:text-dark-text-primary tracking-wide'>
              ALL
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-brand-orange-500 mb-2'>
                3
              </div>
              <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                CONFIRMED DEALS
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-red-400 mb-2'>2</div>
              <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                MAJOR DEVELOPMENTS
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-yellow-400 mb-2'>
                £127m
              </div>
              <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                TOTAL FEES
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-blue-400 mb-2'>12</div>
              <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                CLUBS INVOLVED
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div className='max-w-4xl mx-auto'>
          <h2 className='text-2xl font-bold text-dark-text-primary mb-8 text-center'>
            Transfer Timeline
          </h2>

          <div className='space-y-6'>
            {weeklyHighlights.map((highlight, index) => (
              <Card
                key={highlight.id}
                className={`border-l-4 ${tierColors[highlight.tier]}`}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-xs font-mono font-medium px-2 py-1 bg-dark-surface border border-dark-border rounded tracking-wide'>
                        {tierLabels[highlight.tier]}
                      </span>
                      <span
                        className={`text-xs font-mono font-medium px-2 py-1 rounded tracking-wide ${impactColors[highlight.impact]}`}
                      >
                        {highlight.impact} IMPACT
                      </span>
                      <span className='text-xs font-mono text-dark-text-muted tracking-wide'>
                        {highlight.category}
                      </span>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-mono text-dark-text-primary tracking-wide'>
                        {highlight.dayOfWeek}
                      </div>
                      <div className='text-xs font-mono text-dark-text-muted tracking-wide'>
                        {new Date(highlight.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Club and Player Pills */}
                  <div className='flex flex-wrap gap-2 mb-4'>
                    {highlight.clubs.map((club) => (
                      <span
                        key={club}
                        className='text-xs font-mono font-medium px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-wide'
                      >
                        {club}
                      </span>
                    ))}
                    {highlight.players.map((player) => (
                      <span
                        key={player}
                        className='text-xs font-mono font-medium px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full tracking-wide'
                      >
                        {player}
                      </span>
                    ))}
                  </div>

                  <h3 className='text-xl font-bold text-dark-text-primary mb-3'>
                    {highlight.title}
                  </h3>

                  <p className='text-dark-text-muted leading-relaxed'>
                    {highlight.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Archive navigation */}
        <div className='text-center mt-12'>
          <Button variant='outline' size='lg'>
            View Previous Weeks
          </Button>
        </div>
      </Container>
    </div>
  );
}
