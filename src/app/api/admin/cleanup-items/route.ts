import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Item from '@/models/Item';
import Stock from '@/models/Stock';
import StockLog from '@/models/StockLog';
import { successResponse, errorResponse } from '@/utils/responseHandler';

// POST /api/admin/cleanup-items - Delete all English-named items
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    // Only admin can cleanup items
    if (authResult.user?.role !== 'admin') {
      return errorResponse('Forbidden - Admin only', 403);
    }

    await dbConnect();

    // Find all items with English names (A-Z, a-z)
    const englishItems = await Item.find({
      name: { $regex: /^[A-Za-z]/, $options: '' }
    });

    const deletedItems: string[] = [];
    const deletedIds: string[] = [];

    for (const item of englishItems) {
      // Delete related stocks and stock logs
      await Stock.deleteMany({ itemId: item._id });
      await StockLog.deleteMany({ itemId: item._id });
      
      // Delete the item
      await Item.findByIdAndDelete(item._id);
      
      deletedItems.push(item.name);
      deletedIds.push(item._id.toString());
    }

    return successResponse({
      deletedCount: deletedItems.length,
      deletedItems,
      deletedIds,
    }, `Deleted ${deletedItems.length} English-named items`);
  } catch (error: any) {
    console.error('Cleanup items error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

// GET /api/admin/cleanup-items - Preview English-named items (without deleting)
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    // Only admin can view
    if (authResult.user?.role !== 'admin') {
      return errorResponse('Forbidden - Admin only', 403);
    }

    await dbConnect();

    // Find all items with English names (starts with A-Z or a-z)
    const englishItems = await Item.find({
      name: { $regex: /^[A-Za-z]/, $options: '' }
    }).select('name unit description');

    return successResponse({
      count: englishItems.length,
      items: englishItems,
    }, `Found ${englishItems.length} English-named items`);
  } catch (error: any) {
    console.error('Preview cleanup error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
