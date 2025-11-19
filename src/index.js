import { fetchRSSFeed } from './rss-fetcher.js';
import { deduplicate } from './deduplicator.js';
import { rewriteWithAI } from './ai-rewriter.js';
import { sendToTelegram } from './telegram-sender.js';
import { execSync } from 'child_process';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('\n=====================================');
  console.log(' RSS Telegram AI Bot Started');
  console.log('Time:', new Date().toISOString());
  console.log('=====================================\n');

  try {
    // Step 1: Fetch RSS
    console.log('[1/5] Fetching RSS feed...');
    const RSS_URL = 'https://lenta.ru/rss/news/world';
    const rawItems = await fetchRSSFeed(RSS_URL);
    console.log(`[] Fetched ${rawItems.length} items\n`);

    if (rawItems.length === 0) {
      console.log('[] No items fetched, exiting');
      return;
    }

    // Step 2: Deduplicate
    console.log('[2/5] Deduplicating items...');
    const { unique: uniqueItems } = await deduplicate(rawItems);
    console.log(`[] Found ${uniqueItems.length} unique items\n`);

    if (uniqueItems.length === 0) {
      console.log('[] No new items to process');
      return;
    }

    // Step 3: Rewrite with AI
    console.log('[3/5] Processing with AI...');
    for (const item of uniqueItems) {
      item.rewritten = await rewriteWithAI(item.description);
      await sleep(1000);
    }
    console.log(`[] AI processing complete\n`);

    // Step 4: Send to Telegram
    console.log('[4/5] Sending to Telegram...');
    const results = await sendToTelegram(uniqueItems);
    console.log(`[] Sent ${results.length} messages\n`);

    // Step 5: Git commit
    console.log('[5/5] Committing to Git...');
    execSync('git config user.email "bot@telegram.local"');
    execSync('git config user.name "RSS Bot"');
    execSync('git add dedup_state.json failed_posts.json 2>/dev/null || true');
    execSync(`git commit -m "Update RSS state: ${new Date().toISOString()}" || true`);
    execSync('git push origin main');
    console.log('[] Git commit successful\n');

    console.log('=====================================');
    console.log(' Bot execution completed successfully');
    console.log(`Processed: ${rawItems.length} items`);
    console.log(`New: ${uniqueItems.length} items`);
    console.log(`Sent: ${results.length} messages`);
    console.log('=====================================\n');

  } catch (error) {
    console.error(' FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
