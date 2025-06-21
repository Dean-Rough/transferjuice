import { FeedItem } from './FeedItem';

async function getFeedData() {
  try {
    const res = await fetch('http://localhost:4433/api/feed?limit=20', {
      next: { revalidate: 60 } // Revalidate every minute
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch feed:', error);
    return null;
  }
}

export async function ServerFeedContainer() {
  const feedData = await getFeedData();
  
  if (!feedData || !feedData.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load feed</div>
      </div>
    );
  }
  
  const items = feedData.data || [];
  
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
        {items.map((item: any) => (
          <FeedItem 
            key={item.id} 
            item={{
              ...item,
              timestamp: new Date(item.timestamp)
            }} 
          />
        ))}
      </div>
    </div>
  );
}