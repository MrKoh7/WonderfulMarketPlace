import type { Request, Response } from 'express';
import OpenAI from 'openai';
import { ENV } from '../config/env';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: ENV.OPENROUTER_API_KEY,
});

const MODEL_CASCADE = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'openai/gpt-oss-120b:free',
  'stepfun/step-3.5-flash:free',
];

export const generateDescription = async (req: Request, res: Response) => {
  console.log('[AI] Request received, title:', req.body.productTitle);
  const { productTitle } = req.body;

  //Guard Clause: Ensure product title is provided to generate description
  if (!productTitle?.trim()) {
    res
      .status(400)
      .json({ error: 'Product title is required to generate a description' });
    return;
  }

  const systemPrompt = `You are a product copywriter for an online marketplace. 
    Write concise, compelling product descriptions in 2-3 sentences. Focus on benefits, quality, and customer appeal.
    Return only the description - no labels, no bullet points, no quotes.`;

  const userPrompt = `Write a product description for: ${productTitle}`;

  // SSE Headers

  // tells browser this is a streaming response, not a one-shot JSON payload
  res.setHeader('Content-Type', 'text/event-stream');
  // prevents the browser or any proxy from caching the stream
  res.setHeader('Cache-Control', 'no-cache');
  // keeps the TCP connection open while tokens are being sent
  res.setHeader('Connection', 'keep-alive');

  for (const model of MODEL_CASCADE) {
    try {
      console.log(`[AI] Trying model: ${model}`);
      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150,
        stream: true,
      });

      // Stream each token back to frontend as it arrives
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      return; // success - exit, don't try fallback
    } catch (error: any) {
      console.warn(`[AI] Model ${model} failed: `, error.message);
    }
  }

  // All models failed
  res.write(
    `data: ${JSON.stringify({ error: 'AI service unavailable.' })}\n\n`,
  );
  res.end();
};
