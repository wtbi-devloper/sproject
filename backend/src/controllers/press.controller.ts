import { Request, Response, NextFunction } from 'express';
import PressItem from '../models/PressItem';
import { deleteGalleryAndBlurFromR2 } from '../utils/r2ImageDeletion';

const R2_PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL || '';

function isR2Url(url: string): boolean {
  return !!R2_PUBLIC_BASE && url.startsWith(R2_PUBLIC_BASE);
}

export async function getPress(req: Request, res: Response, next: NextFunction) {
  try {
    const query: Record<string, any> = {};
    if (req.query.search) {
      const s = new RegExp(req.query.search as string, 'i');
      query.$or = [{ outlet: s }, { title: s }, { year: s }];
    }
    if (req.query.year) query.year = req.query.year as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    const items = await PressItem.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, data: items, count: items.length });
  } catch (err) {
    next(err);
  }
}

export async function getPressById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await PressItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Press item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function createPress(req: Request, res: Response, next: NextFunction) {
  try {
    const { outlet, outletLogo, outletLogoBlurUrl, mediaType, title, year, url, order, images, imageBlurUrls, isOptimized } = req.body;
    if (!outlet || !title || !year) {
      res.status(400).json({ success: false, error: 'Outlet, title, and year are required' });
      return;
    }
    const item = await PressItem.create({
      outlet,
      outletLogo: outletLogo || '',
      outletLogoBlurUrl: outletLogoBlurUrl || '',
      mediaType: mediaType || 'Newspaper',
      title,
      year,
      url,
      order,
      images,
      imageBlurUrls,
      isOptimized,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updatePress(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await PressItem.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!item) {
      res.status(404).json({ success: false, error: 'Press item not found' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deletePress(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await PressItem.findById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Press item not found' });
      return;
    }

    const imagesToDelete = [...(item.images || [])];
    const blursToDelete = [...(item.imageBlurUrls || [])];
    if (item.outletLogo) imagesToDelete.push(item.outletLogo);
    if (item.outletLogoBlurUrl) blursToDelete.push(item.outletLogoBlurUrl);

    await deleteGalleryAndBlurFromR2(imagesToDelete, blursToDelete, isR2Url);

    await PressItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
}
