import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export async function fetchRSSFeed(feedUrl) {
  try {
    console.log('[RSS Fetcher] Fetching from:', feedUrl);
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText);
    
    const items = parsed.rss?.channel?.[0]?.item || [];
    
    const result = items.map(item => ({
      title: item.title?.[0] || 'No title',
      link: item.link?.[0] || '',
      description: item.description?.[0] || item.title?.[0] || '',
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
      source: 'Lenta.ru'
    }));

    console.log(`[RSS Fetcher]  Found ${result.length} items`);
    return result;

  } catch (error) {
    console.error('[RSS Fetcher]  Error:', error.message);
    return [];
  }
}
