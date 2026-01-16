import { Request, Response, NextFunction } from 'express';
import { feedbackService } from '../services/feedback.service';
import { canGiveFeedback } from "../services/permissionService";


export const createFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id; // authMiddleware
    const { toUserId } = req.body;

    const allowed = await canGiveFeedback(userId, toUserId);

    if (!allowed) {
      return res.status(403).json({
        error: "No tienes permiso para dar feedback a este usuario",
      });
    }

    const feedback = await feedbackService.create(userId, req.body);
    res.status(201).json(feedback);

  } catch (error) {
    next(error);
  }
};


export const getFeedbacks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await feedbackService.findAll(userId, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const feedback = await feedbackService.findOne(userId, req.params.id);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const updateFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const feedback = await feedbackService.update(userId, req.params.id, req.body);
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await feedbackService.delete(userId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};