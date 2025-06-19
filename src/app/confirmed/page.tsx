'use client';

import { useState, useMemo, useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ParallaxSection } from '@/components/ui/ParallaxSection';
import {
  transfermarktAPI,
  type PlayerProfile,
  type ClubProfile,
} from '@/lib/transfermarkt-api';
import Image from 'next/image';
import Fuse from 'fuse.js';

interface ConfirmedTransfer {
  id: string;
  playerName: string;
  age: number;
  nationality: string;
  position: string;
  fromClub: string;
  toClub: string;
  fee: string;
  estimatedValue: string;
  transferDate: string;
  contractLength: string;
  playerImage?: string;
  fromClubBadge?: string;
  toClubBadge?: string;
  // Enhanced with API data
  playerData?: PlayerProfile;
  fromClubData?: ClubProfile;
  toClubData?: ClubProfile;
}

// Mock data - in production this would come from your API
const confirmedTransfers: ConfirmedTransfer[] = [
  {
    id: '1',
    playerName: 'Evan Ferguson',
    age: 21,
    nationality: 'Ireland',
    position: 'Striker',
    fromClub: 'Brighton',
    toClub: 'Arsenal',
    fee: '£45.0m',
    estimatedValue: '£42.0m',
    transferDate: '2024-01-15',
    contractLength: '5 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
  {
    id: '2',
    playerName: 'Enzo Fernandez',
    age: 26,
    nationality: 'Argentina',
    position: 'Midfielder',
    fromClub: 'Benfica',
    toClub: 'Chelsea',
    fee: '£106.8m',
    estimatedValue: '£95.0m',
    transferDate: '2024-01-12',
    contractLength: '6 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
  {
    id: '3',
    playerName: 'Matheus Cunha',
    age: 24,
    nationality: 'Brazil',
    position: 'Forward',
    fromClub: 'Wolves',
    toClub: 'West Ham',
    fee: '£32.0m',
    estimatedValue: '£28.0m',
    transferDate: '2024-01-10',
    contractLength: '4 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
  {
    id: '4',
    playerName: 'Sven Botman',
    age: 24,
    nationality: 'Netherlands',
    position: 'Centre-Back',
    fromClub: 'Newcastle',
    toClub: 'Tottenham',
    fee: '£55.0m',
    estimatedValue: '£48.0m',
    transferDate: '2024-01-08',
    contractLength: '5 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
  {
    id: '5',
    playerName: 'Joao Felix',
    age: 24,
    nationality: 'Portugal',
    position: 'Attacking Midfielder',
    fromClub: 'Atletico Madrid',
    toClub: 'Manchester United',
    fee: '£68.0m',
    estimatedValue: '£65.0m',
    transferDate: '2024-01-05',
    contractLength: '6 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
  {
    id: '6',
    playerName: 'Victor Osimhen',
    age: 25,
    nationality: 'Nigeria',
    position: 'Striker',
    fromClub: 'Napoli',
    toClub: 'Liverpool',
    fee: '£89.0m',
    estimatedValue: '£85.0m',
    transferDate: '2024-01-03',
    contractLength: '5 years',
    playerImage: '/api/placeholder/60/60',
    fromClubBadge: '/api/placeholder/30/30',
    toClubBadge: '/api/placeholder/30/30',
  },
];

type SortField = keyof ConfirmedTransfer;
type SortDirection = 'asc' | 'desc';

export default function ConfirmedPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('transferDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [enrichedTransfers, setEnrichedTransfers] =
    useState<ConfirmedTransfer[]>(confirmedTransfers);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Function to test and enrich transfer data with real API
  const testTransfermarktAPI = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      console.log('🚀 Starting Transfermarkt API test scrape...');

      // Test with first transfer - Evan Ferguson
      const testTransfer = confirmedTransfers[0];
      console.log(
        `Testing with: ${testTransfer.playerName} - ${testTransfer.fromClub} to ${testTransfer.toClub}`
      );

      const enrichedData = await transfermarktAPI.getEnrichedTransfer(
        testTransfer.playerName,
        testTransfer.fromClub,
        testTransfer.toClub
      );

      console.log('📊 API Response:', enrichedData);

      if (enrichedData.player) {
        console.log('✅ Player data found:', {
          name: enrichedData.player.name,
          image: enrichedData.player.image_url,
          position: enrichedData.player.position,
          market_value: enrichedData.player.market_value,
          nationality: enrichedData.player.nationality,
        });
      }

      if (enrichedData.fromClubData) {
        console.log('✅ From Club data found:', {
          name: enrichedData.fromClubData.name,
          image: enrichedData.fromClubData.image_url,
        });
      }

      if (enrichedData.toClubData) {
        console.log('✅ To Club data found:', {
          name: enrichedData.toClubData.name,
          image: enrichedData.toClubData.image_url,
        });
      }

      // Update the first transfer with real data
      const updatedTransfers = [...confirmedTransfers];
      updatedTransfers[0] = {
        ...testTransfer,
        playerData: enrichedData.player || undefined,
        fromClubData: enrichedData.fromClubData || undefined,
        toClubData: enrichedData.toClubData || undefined,
        playerImage: enrichedData.player?.image_url || testTransfer.playerImage,
        fromClubBadge:
          enrichedData.fromClubData?.image_url || testTransfer.fromClubBadge,
        toClubBadge:
          enrichedData.toClubData?.image_url || testTransfer.toClubBadge,
        estimatedValue:
          enrichedData.player?.market_value || testTransfer.estimatedValue,
      };

      setEnrichedTransfers(updatedTransfers);
      console.log('🎉 Successfully enriched transfer data!');
    } catch (error) {
      console.error('❌ API Error:', error);
      setApiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to test Premier League clubs
  const testPremierLeagueClubs = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      console.log('🏆 Testing Premier League clubs fetch...');
      const clubs = await transfermarktAPI.getPremierLeagueClubs();
      console.log(
        `✅ Found ${clubs.length} Premier League clubs:`,
        clubs.slice(0, 5)
      );
    } catch (error) {
      console.error('❌ Premier League clubs error:', error);
      setApiError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(enrichedTransfers, {
      keys: [
        'playerName',
        'nationality',
        'position',
        'fromClub',
        'toClub',
        'fee',
        'estimatedValue',
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }, [enrichedTransfers]);

  // Filter and sort transfers
  const filteredAndSortedTransfers = useMemo(() => {
    let transfers = enrichedTransfers;

    // Apply search filter
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      transfers = results.map((result) => result.item);
    }

    // Apply sorting
    transfers.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // For fee and value, extract numbers for proper sorting
        if (sortField === 'fee' || sortField === 'estimatedValue') {
          const aNum = parseFloat(aValue.replace(/[£m]/g, ''));
          const bNum = parseFloat(bValue.replace(/[£m]/g, ''));
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // For dates
        if (sortField === 'transferDate') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortDirection === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        // For strings
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // For numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return transfers;
  }, [searchTerm, sortField, sortDirection, fuse, enrichedTransfers]);

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

  return (
    <>
      {/* Header with Parallax */}
      <ParallaxSection
        backgroundImage='https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
        overlay='brand'
        height='half'
        speed={0.4}
        className='flex items-center'
      >
        <Container>
          <div className='text-center'>
            <h1 className='text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg'>
              Confirmed Transfers
            </h1>
            <p className='text-lg text-gray-100 max-w-2xl mx-auto drop-shadow-md'>
              All major Premier League transfers that have been officially
              confirmed. Search, sort, and filter to find exactly what you're
              looking for.
            </p>
          </div>
        </Container>
      </ParallaxSection>

      <div className='py-12'>
        <Container>
          {/* API Test Controls */}
          <div className='mb-8 text-center'>
            <div className='bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-4xl mx-auto'>
              <h3 className='text-lg font-bold text-gray-900 dark:text-gray-50 mb-4'>
                🧪 Transfermarkt API Test Lab
              </h3>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-4'>
                <Button
                  onClick={testTransfermarktAPI}
                  disabled={isLoading}
                  className='w-full sm:w-auto'
                >
                  {isLoading ? '🔄 Testing...' : '🚀 Test Player & Clubs API'}
                </Button>
                <Button
                  onClick={testPremierLeagueClubs}
                  disabled={isLoading}
                  variant='outline'
                  className='w-full sm:w-auto'
                >
                  {isLoading ? '🔄 Loading...' : '🏆 Test Premier League Clubs'}
                </Button>
              </div>
              {apiError && (
                <div className='text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-3'>
                  ❌ API Error: {apiError}
                </div>
              )}
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                Open browser console (F12) to see detailed API responses
              </p>
            </div>
          </div>

          {/* Search and filters */}
          <div className='mb-8'>
            <div className='max-w-md mx-auto'>
              <Input
                type='text'
                placeholder='Search players, clubs, fees...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full'
              />
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-12'>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='text-3xl font-black text-brand-orange-500 mb-2'>
                  {filteredAndSortedTransfers.length}
                </div>
                <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                  CONFIRMED DEALS
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='text-3xl font-black text-green-400 mb-2'>
                  £
                  {filteredAndSortedTransfers
                    .reduce((total, transfer) => {
                      const fee = parseFloat(transfer.fee.replace(/[£m]/g, ''));
                      return total + fee;
                    }, 0)
                    .toFixed(0)}
                  m
                </div>
                <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                  TOTAL SPENT
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='text-3xl font-black text-blue-400 mb-2'>
                  {
                    new Set(filteredAndSortedTransfers.map((t) => t.toClub))
                      .size
                  }
                </div>
                <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                  BUYING CLUBS
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6 text-center'>
                <div className='text-3xl font-black text-purple-400 mb-2'>
                  {
                    new Set(
                      filteredAndSortedTransfers.map((t) => t.nationality)
                    ).size
                  }
                </div>
                <div className='text-sm font-mono text-dark-text-muted tracking-wide'>
                  NATIONALITIES
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardContent className='p-0'>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-dark-border'>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('playerName')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>PLAYER</span>
                          <span className='text-xs'>
                            {getSortIcon('playerName')}
                          </span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('age')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>AGE</span>
                          <span className='text-xs'>{getSortIcon('age')}</span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('nationality')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>NATIONALITY</span>
                          <span className='text-xs'>
                            {getSortIcon('nationality')}
                          </span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('position')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>POSITION</span>
                          <span className='text-xs'>
                            {getSortIcon('position')}
                          </span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <span className='text-sm font-mono font-semibold text-dark-text-primary tracking-wide'>
                          TRANSFER
                        </span>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('fee')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>FEE</span>
                          <span className='text-xs'>{getSortIcon('fee')}</span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('estimatedValue')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>VALUE</span>
                          <span className='text-xs'>
                            {getSortIcon('estimatedValue')}
                          </span>
                        </button>
                      </th>
                      <th className='text-left p-4'>
                        <button
                          onClick={() => handleSort('transferDate')}
                          className='text-sm font-mono font-semibold text-dark-text-primary hover:text-brand-orange-500 tracking-wide flex items-center space-x-1'
                        >
                          <span>DATE</span>
                          <span className='text-xs'>
                            {getSortIcon('transferDate')}
                          </span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedTransfers.map((transfer) => (
                      <tr
                        key={transfer.id}
                        className='border-b border-dark-border hover:bg-dark-surface transition-colors'
                      >
                        <td className='p-4'>
                          <div className='flex items-center space-x-3'>
                            {(transfer.playerData?.image_url ||
                              transfer.playerImage) && (
                              <div className='w-12 h-12 rounded-full overflow-hidden bg-dark-surface border border-dark-border'>
                                <Image
                                  src={
                                    transfer.playerData?.image_url ||
                                    transfer.playerImage ||
                                    '/api/placeholder/48/48'
                                  }
                                  alt={transfer.playerName}
                                  width={48}
                                  height={48}
                                  className='w-full h-full object-cover'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/api/placeholder/48/48';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className='font-semibold text-dark-text-primary'>
                                {transfer.playerData?.name ||
                                  transfer.playerName}
                                {transfer.playerData && (
                                  <span className='ml-2 text-xs text-green-400'>
                                    ✓ API
                                  </span>
                                )}
                              </div>
                              <div className='text-xs font-mono text-dark-text-muted tracking-wide'>
                                {transfer.contractLength}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='p-4 text-dark-text-muted'>
                          {transfer.age}
                        </td>
                        <td className='p-4 text-dark-text-muted'>
                          {transfer.nationality}
                        </td>
                        <td className='p-4'>
                          <span className='text-xs font-mono px-2 py-1 bg-dark-surface border border-dark-border rounded tracking-wide text-dark-text-muted'>
                            {transfer.position}
                          </span>
                        </td>
                        <td className='p-4'>
                          <div className='flex items-center space-x-2'>
                            <div className='flex items-center space-x-2'>
                              {(transfer.fromClubData?.image_url ||
                                transfer.fromClubBadge) && (
                                <div className='w-5 h-5 rounded overflow-hidden'>
                                  <Image
                                    src={
                                      transfer.fromClubData?.image_url ||
                                      transfer.fromClubBadge ||
                                      '/api/placeholder/20/20'
                                    }
                                    alt={transfer.fromClub}
                                    width={20}
                                    height={20}
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src = '/api/placeholder/20/20';
                                    }}
                                  />
                                </div>
                              )}
                              <span className='text-sm text-dark-text-muted'>
                                {transfer.fromClubData?.name ||
                                  transfer.fromClub}
                              </span>
                            </div>
                            <span className='text-brand-orange-500'>→</span>
                            <div className='flex items-center space-x-2'>
                              {(transfer.toClubData?.image_url ||
                                transfer.toClubBadge) && (
                                <div className='w-5 h-5 rounded overflow-hidden'>
                                  <Image
                                    src={
                                      transfer.toClubData?.image_url ||
                                      transfer.toClubBadge ||
                                      '/api/placeholder/20/20'
                                    }
                                    alt={transfer.toClub}
                                    width={20}
                                    height={20}
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src = '/api/placeholder/20/20';
                                    }}
                                  />
                                </div>
                              )}
                              <span className='text-sm font-semibold text-dark-text-primary'>
                                {transfer.toClubData?.name || transfer.toClub}
                                {transfer.toClubData && (
                                  <span className='ml-1 text-xs text-green-400'>
                                    ✓
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className='p-4 font-semibold text-green-400'>
                          {transfer.fee}
                        </td>
                        <td className='p-4 text-dark-text-muted'>
                          {transfer.estimatedValue}
                        </td>
                        <td className='p-4 text-dark-text-muted'>
                          {new Date(transfer.transferDate).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedTransfers.length === 0 && (
                <div className='text-center py-12'>
                  <p className='text-dark-text-muted'>
                    No transfers found matching your search.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export options */}
          <div className='text-center mt-8'>
            <div className='flex justify-center space-x-4'>
              <Button variant='outline' size='sm'>
                Export CSV
              </Button>
              <Button variant='outline' size='sm'>
                Export JSON
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
