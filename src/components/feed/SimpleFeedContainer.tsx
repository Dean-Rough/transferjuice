'use client';

import { useEffect, useState } from 'react';
import { FeedItem } from './FeedItem';

export function SimpleFeedContainer() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SimpleFeedContainer: Fetching feed...');
    
    fetch('/api/feed?limit=20')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('SimpleFeedContainer: Data received', data);
        if (data.success && data.data) {
          setItems(data.data);
        } else {
          throw new Error(data.error || 'Invalid response');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('SimpleFeedContainer: Error', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No transfer updates available</div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <div className="border-b border-border p-4">
        <h2 className="text-xl font-bold">Live Transfer Feed</h2>
        <p className="text-sm text-gray-500">{items.length} updates</p>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <FeedItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}