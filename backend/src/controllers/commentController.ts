import type { Request, Response } from 'express';
import * as queries from '../db/queries';
import { getAuth } from '@clerk/express';

export const createComment = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { productId } = req.params as { productId: string };
    const { content } = req.body;

    if (!content)
      return res.status(400).json({ error: 'Comment content is required' });

    const product = await queries.getProductById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const comment = await queries.createComment({
      content,
      userId,
      productId,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment: ', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { commentId } = req.params as { commentId: string };

    const exisitingComment = await queries.getCommentById(commentId);
    if (!exisitingComment)
      return res.status(404).json({ error: 'Comment not found' });

    if (exisitingComment.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own comment' });
    }

    await queries.deleteComment(commentId);
  } catch (error) {
    console.error('Error Deleting Comment: ', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
