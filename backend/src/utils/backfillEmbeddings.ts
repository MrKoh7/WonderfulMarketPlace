import { config } from 'dotenv';
config();

import { generateEmbedding } from '../controllers/aiController';
import {
  getProductWithoutEmbedding,
  updateProductEmbedding,
} from '../db/queries';

const backfill = async () => {
  console.log('[Backfill] Starting embedding backfill...');

  const unembedded = await getProductWithoutEmbedding();
  console.log(
    `[Backfill] Found ${unembedded.length} products without embeddings`,
  );

  if (unembedded.length === 0) {
    console.log('[Backfill] Nothing to embed.');
    process.exit(0);
  }

  let success = 0;
  let failed = 0;

  for (const product of unembedded) {
    try {
      const text = `${product.title} ${product.description}`;
      const embedding = await generateEmbedding(text);
      await updateProductEmbedding(product.id, embedding);
      console.log(`[Backfill] ✅ ${product.title} - ${product.description}'`);
      success++;
    } catch (error: any) {
      console.error(
        `[Backfill] ❌ ${product.title} - ${product.description}': ${error.message}`,
      );
      failed++;
    }
  }

  console.log(`[Backfill] DONE. Success: ${success}, Failed: ${failed}`);
  process.exit(0);
};

backfill();
