/**
 * Slug Generation Utilities
 * URL-friendly slug creation for briefings
 */

/**
 * Generate URL-friendly slug from title and timestamp
 */
export function generateSlug(title: string, timestamp: Date): string {
  // Format date as YYYY-MM-DD-HH
  const dateStr = timestamp.toISOString()
    .slice(0, 13)
    .replace('T', '-')
    .replace(/:/g, '');
  
  // Create slug from title
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50); // Limit length
  
  return `${dateStr}-${titleSlug}`;
}

/**
 * Extract timestamp from slug
 */
export function getTimestampFromSlug(slug: string): Date | null {
  try {
    // Extract date part (YYYY-MM-DD-HH)
    const match = slug.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})/);
    if (!match) return null;
    
    const [_, year, month, day, hour] = match;
    return new Date(`${year}-${month}-${day}T${hour}:00:00Z`);
  } catch {
    return null;
  }
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-\d{2}-[a-z0-9-]+$/.test(slug);
}