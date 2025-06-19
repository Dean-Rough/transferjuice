import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BriefingUpdate {
  time: string;
  content: string;
}

interface Briefing {
  id: string;
  type: 'morning' | 'afternoon' | 'evening';
  date: string;
  time: string;
  title: string;
  content: string;
  image?: string;
  tags: string[];
  clubs: string[];
  players: string[];
  updates: BriefingUpdate[];
}

interface BriefingCardProps {
  briefing: Briefing;
}

const briefingTypeColors = {
  morning: 'text-brand-orange-500 bg-brand-orange-500/10',
  afternoon: 'text-blue-500 bg-blue-500/10',
  evening: 'text-purple-500 bg-purple-500/10',
};

const briefingTypeLabels = {
  morning: 'MORNING BRIEF',
  afternoon: 'AFTERNOON BRIEF',
  evening: 'EVENING BRIEF',
};

export function BriefingCard({ briefing }: BriefingCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-0'>
        {/* Header */}
        <div className='p-6 pb-4 border-b border-dark-border'>
          <div className='flex items-center justify-between mb-4'>
            <span
              className={`text-xs font-mono font-medium px-3 py-1 rounded-full tracking-wide ${briefingTypeColors[briefing.type]}`}
            >
              {briefingTypeLabels[briefing.type]}
            </span>
            <span className='text-xs font-mono text-dark-text-muted tracking-wide'>
              {formatDate(briefing.date)}, {briefing.time}
            </span>
          </div>

          {/* Club and Player Pills */}
          <div className='flex flex-wrap gap-2 mb-4'>
            {briefing.clubs.map((club) => (
              <span
                key={club}
                className='text-xs font-mono font-medium px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-wide'
              >
                {club}
              </span>
            ))}
            {briefing.players.map((player) => (
              <span
                key={player}
                className='text-xs font-mono font-medium px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full tracking-wide'
              >
                {player}
              </span>
            ))}
          </div>

          <h2 className='text-2xl font-bold text-dark-text-primary mb-4 leading-tight'>
            {briefing.title}
          </h2>

          {/* Tags */}
          <div className='flex flex-wrap gap-2'>
            {briefing.tags.map((tag) => (
              <span
                key={tag}
                className='text-xs font-mono px-2 py-1 bg-dark-surface border border-dark-border rounded tracking-wide text-dark-text-muted'
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Image */}
        {briefing.image && (
          <div className='relative aspect-video'>
            <Image
              src={briefing.image}
              alt={briefing.title}
              fill
              className='object-cover'
            />
          </div>
        )}

        {/* Content */}
        <div className='p-6'>
          <div
            className='prose prose-invert max-w-none mb-6'
            dangerouslySetInnerHTML={{ __html: briefing.content }}
          />

          {/* Live Updates */}
          {briefing.updates.length > 0 && (
            <div className='border-t border-dark-border pt-6'>
              <div className='flex items-center space-x-2 mb-4'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <h3 className='text-sm font-mono font-semibold text-dark-text-primary tracking-wide'>
                  LIVE UPDATES
                </h3>
              </div>

              <div className='space-y-3'>
                {briefing.updates.map((update, index) => (
                  <div key={index} className='flex space-x-3 text-sm'>
                    <span className='font-mono text-brand-orange-500 tracking-wide shrink-0'>
                      {update.time}
                    </span>
                    <span className='text-dark-text-muted'>
                      {update.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-between mt-6 pt-4 border-t border-dark-border'>
            <div className='flex space-x-3'>
              <Button variant='ghost' size='sm'>
                <svg
                  className='w-4 h-4 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                  />
                </svg>
                Save
              </Button>
              <Button variant='ghost' size='sm'>
                <svg
                  className='w-4 h-4 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                  />
                </svg>
                Share
              </Button>
            </div>

            <Button variant='outline' size='sm'>
              Read Full Story →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
