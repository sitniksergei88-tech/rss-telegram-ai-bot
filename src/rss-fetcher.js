import fetch from 'node-fetch';
import xml2js from 'xml2js';

export async function fetchRSSFeed(feedUrl) {
  try {
    const response = await fetch(feedUrl);
    const xmlData = await response.text();
    const parser = new xml2js.Parser();
    const data = await parser.parseStringPromise(xmlData);
    
    const items = data.rss.channel[0].item || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    return items
      .map(item => ({
        title: item.title?.[0] || 'No title',
        link: item.link?.[0] || '',
        pubDate: item.pubDate?.[0] || '',
        description: item.description?.[0] || '',
        image: extractImageFromDescription(item.description?.[0] || '')
      }))
      .filter(item => {
        const pubTime = new Date(item.pubDate).getTime();
        return pubTime > oneHourAgo;
      })
      .slice(0, 10);
  } catch (error) {
    console.error(`Error fetching RSS feed: ${error.message}`);
    return [];
  }
}

function extractImageFromDescription(description) {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/;
  const match = description.match(imgRegex);
  return match ? match[1] : null;
}
