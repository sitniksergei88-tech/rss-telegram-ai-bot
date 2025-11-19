import fs from 'fs/promises';
import crypto from 'crypto';

export async function loadState() {
  try {
    const data = await fs.readFile('dedup_state.json', 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      seen_urls: {},
      last_check: new Date().toISOString(),
      total_processed: 0,
      duplicates_removed: 0
    };
  }
}

function generateHash(item) {
  const content = `${item.title}|${item.link}|${item.pubDate}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function deduplicate(items) {
  const state = await loadState();
  const unique = [];
  const duplicates = [];

  for (const item of items) {
    if (state.seen_urls[item.link]) {
      duplicates.push(item);
      continue;
    }

    const isDuplicate = Object.values(state.seen_urls)
      .some(v => v.hash === generateHash(item));
    
    if (isDuplicate) {
      duplicates.push(item);
      continue;
    }

    unique.push(item);
    state.seen_urls[item.link] = {
      hash: generateHash(item),
      title: item.title,
      timestamp: new Date().toISOString()
    };
  }

  console.log(`[Deduplicator] Unique: ${unique.length}, Duplicates: ${duplicates.length}`);
  
  await fs.writeFile('dedup_state.json', JSON.stringify(state, null, 2));
  state.total_processed = Object.keys(state.seen_urls).length;
  state.duplicates_removed = duplicates.length;

  return { unique, state };
}
