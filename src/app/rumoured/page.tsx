'use client';

import { useState, useMemo } from 'react';
import { Container } from '@/components/layout/Container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RumouredTransfer } from '@/types/transfers';
import Fuse from 'fuse.js';

// Mock data - in production this would come from Twitter parsing
const rumouredTransfers: RumouredTransfer[] = [
  {
    id: '1',
    playerName: 'Kylian Mbappé',
    fromClub: 'PSG',
    toClub: 'Arsenal',
    estimatedFee: '£180m',
    status: 'rumoured',
    type: 'permanent',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    reliability: 'tier2',
    likelihood: 'medium',
    lastUpdate: 'Arsenal preparing massive bid after Champions League exit',
    updates: [
      {
        id: 'u1',
        content: 'Arsenal exploring possibility of Mbappé move',
        timestamp: '2024-01-20T10:00:00Z',
        source: '@FabrizioRomano',
        tier: 'tier1',
      },
      {
        id: 'u2',
        content: 'Gunners ready to break transfer record',
        timestamp: '2024-01-20T15:30:00Z',
        source: '@Arsenal_ITK',
        tier: 'tier3',
      },
    ],
  },
  {
    id: '2',
    playerName: 'Erling Haaland',
    fromClub: 'Manchester City',
    toClub: 'Chelsea',
    estimatedFee: '£200m',
    status: 'close',
    type: 'permanent',
    createdAt: '2024-01-19T14:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z',
    reliability: 'tier1',
    likelihood: 'high',
    lastUpdate: 'Chelsea in advanced talks, medical could be scheduled',
    updates: [
      {
        id: 'u3',
        content: 'Haaland wants new challenge',
        timestamp: '2024-01-19T14:00:00Z',
        source: '@David_Ornstein',
        tier: 'tier1',
      },
    ],
  },
  {
    id: '3',
    playerName: 'Jude Bellingham',
    fromClub: 'Real Madrid',
    toClub: 'Liverpool',
    estimatedFee: '£120m',
    status: 'personal_terms',
    type: 'permanent',
    createdAt: '2024-01-18T16:30:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    reliability: 'tier2',
    likelihood: 'high',
    lastUpdate: 'Personal terms agreed, clubs still negotiating fee',
    updates: [],
  },
  {
    id: '4',
    playerName: 'Marcus Rashford',
    fromClub: 'Manchester United',
    toClub: 'Tottenham',
    estimatedFee: '£80m',
    status: 'bid_submitted',
    type: 'permanent',
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-19T20:45:00Z',
    reliability: 'tier3',
    likelihood: 'medium',
    lastUpdate: 'Spurs submit formal £80m bid for England forward',
    updates: [],
  },
  {
    id: '5',
    playerName: 'Bruno Fernandes',
    fromClub: 'Manchester United',
    toClub: 'Newcastle',
    estimatedFee: '£65m',
    status: 'rumoured',
    type: 'permanent',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-18T14:30:00Z',
    reliability: 'tier4',
    likelihood: 'low',
    lastUpdate: 'Newcastle monitoring situation, no formal approach yet',
    updates: [],
  },
];

const statusColors = {
  rumoured: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  close: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  personal_terms: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  bid_submitted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  medical: 'bg-green-500/10 text-green-400 border-green-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const likelihoodColors = {
  low: 'text-red-400',
  medium: 'text-yellow-400',
  high: 'text-green-400',
};

const tierColors = {
  tier1: 'bg-green-500/10 text-green-400 border-green-500/20',
  tier2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  tier3: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  tier4: 'bg-red-500/10 text-red-400 border-red-500/20',
};

type SortField =
  | 'playerName'
  | 'fromClub'
  | 'toClub'
  | 'estimatedFee'
  | 'status'
  | 'likelihood'
  | 'reliability'
  | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export default function RumouredPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(rumouredTransfers, {
      keys: ['playerName', 'fromClub', 'toClub', 'estimatedFee', 'lastUpdate'],
      threshold: 0.3,
      includeScore: true,
    });
  }, []);

  // Filter and sort transfers
  const filteredAndSortedTransfers = useMemo(() => {
    let transfers = rumouredTransfers;

    // Apply search filter
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      transfers = results.map((result) => result.item);
    }

    // Apply sorting
    transfers.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortField === 'estimatedFee') {
          const aNum = parseFloat(aValue.replace(/[£m]/g, ''));
          const bNum = parseFloat(bValue.replace(/[£m]/g, ''));
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (sortField === 'updatedAt') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortDirection === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return transfers;
  }, [searchTerm, sortField, sortDirection, fuse]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className='py-8'>
      <Container>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-black text-gray-900 dark:text-gray-50 mb-4'>
            Transfer Rumours
          </h1>
          <p className='text-gray-600 dark:text-gray-400 text-lg max-w-2xl'>
            Latest transfer speculation and insider reports. Track the hottest
            rumours as they develop.
          </p>
        </div>

        {/* Search */}
        <div className='mb-8'>
          <div className='max-w-md'>
            <Input
              type='text'
              placeholder='Search rumours...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full'
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-orange-500 mb-2'>
                {
                  filteredAndSortedTransfers.filter(
                    (t) => t.likelihood === 'high'
                  ).length
                }
              </div>
              <div className='text-sm font-mono text-gray-600 dark:text-gray-400 tracking-wide'>
                HIGH LIKELIHOOD
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-green-400 mb-2'>
                £
                {filteredAndSortedTransfers
                  .reduce((total, transfer) => {
                    const fee = parseFloat(
                      transfer.estimatedFee.replace(/[£m]/g, '')
                    );
                    return total + fee;
                  }, 0)
                  .toFixed(0)}
                m
              </div>
              <div className='text-sm font-mono text-gray-600 dark:text-gray-400 tracking-wide'>
                TOTAL VALUE
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-blue-400 mb-2'>
                {
                  filteredAndSortedTransfers.filter(
                    (t) => t.reliability === 'tier1'
                  ).length
                }
              </div>
              <div className='text-sm font-mono text-gray-600 dark:text-gray-400 tracking-wide'>
                TIER 1 SOURCES
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6 text-center'>
              <div className='text-3xl font-black text-purple-400 mb-2'>
                {
                  filteredAndSortedTransfers.filter((t) =>
                    ['close', 'personal_terms', 'bid_submitted'].includes(
                      t.status
                    )
                  ).length
                }
              </div>
              <div className='text-sm font-mono text-gray-600 dark:text-gray-400 tracking-wide'>
                ADVANCED TALKS
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sort Controls */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <Button
            variant={sortField === 'updatedAt' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => handleSort('updatedAt')}
          >
            Latest {getSortIcon('updatedAt')}
          </Button>
          <Button
            variant={sortField === 'likelihood' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => handleSort('likelihood')}
          >
            Likelihood {getSortIcon('likelihood')}
          </Button>
          <Button
            variant={sortField === 'estimatedFee' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => handleSort('estimatedFee')}
          >
            Fee {getSortIcon('estimatedFee')}
          </Button>
          <Button
            variant={sortField === 'reliability' ? 'primary' : 'outline'}
            size='sm'
            onClick={() => handleSort('reliability')}
          >
            Reliability {getSortIcon('reliability')}
          </Button>
        </div>

        {/* Rumours List */}
        <div className='space-y-6'>
          {filteredAndSortedTransfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-xl mb-2'>
                      {transfer.playerName}
                      <span className='mx-2 text-orange-500'>→</span>
                      {transfer.toClub}
                    </CardTitle>
                    <div className='flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400'>
                      <span>
                        From:{' '}
                        <span className='font-semibold'>
                          {transfer.fromClub}
                        </span>
                      </span>
                      <span>
                        Fee:{' '}
                        <span className='font-semibold text-green-400'>
                          {transfer.estimatedFee}
                        </span>
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-mono border ${tierColors[transfer.reliability]}`}
                      >
                        {transfer.reliability.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`text-sm font-semibold ${likelihoodColors[transfer.likelihood]}`}
                    >
                      {transfer.likelihood.toUpperCase()}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {getTimeAgo(transfer.updatedAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Status and Latest Update */}
                  <div className='flex items-start space-x-4'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono border ${statusColors[transfer.status]}`}
                    >
                      {transfer.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className='text-gray-600 dark:text-gray-400 flex-1'>
                      {transfer.lastUpdate}
                    </p>
                  </div>

                  {/* Recent Updates */}
                  {transfer.updates.length > 0 && (
                    <div className='border-t border-gray-200 dark:border-gray-800 pt-4'>
                      <h4 className='text-sm font-mono font-semibold text-gray-900 dark:text-gray-50 mb-3 tracking-wide'>
                        RECENT UPDATES
                      </h4>
                      <div className='space-y-2'>
                        {transfer.updates.slice(0, 3).map((update) => (
                          <div
                            key={update.id}
                            className='flex items-start space-x-3 text-sm'
                          >
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-mono border ${tierColors[update.tier]} flex-shrink-0`}
                            >
                              {update.tier.toUpperCase()}
                            </span>
                            <div className='flex-1'>
                              <p className='text-gray-600 dark:text-gray-400'>
                                {update.content}
                              </p>
                              <div className='flex items-center space-x-2 mt-1 text-xs text-gray-500'>
                                <span>{update.source}</span>
                                <span>•</span>
                                <span>{getTimeAgo(update.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedTransfers.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-gray-600 dark:text-gray-400'>
              No rumours found matching your search.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
