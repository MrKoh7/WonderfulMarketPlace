import type { Request, Response } from 'express';
import * as queries from '../db/queries';
import { getAuth } from '@clerk/express';

export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised!' });

    const { email, name, imageUrl } = req.body;

    if (!email || !name || !imageUrl) {
      res
        .status(404)
        .json({ error: 'Email, name, and imageUrl are required!' });
      return;
    }

    const user = await queries.upsertUser({
      id: userId,
      email,
      name,
      imageUrl,
    });

    res.status(200).json(user);
  } catch (error) {
    console.error('Error Syncing user: ', error);
    res.status(500).json({ error: 'Failed to sync user!' });
  }
}
