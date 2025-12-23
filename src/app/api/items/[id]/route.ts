import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Item from '@/models/Item';
import Stock from '@/models/Stock';
import StockLog from '@/models/StockLog';
import { successResponse, errorResponse } from '@/utils/responseHandler';

// GET /api/items/:id - Get item by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const { id } = await params;
    const item = await Item.findById(id).populate('categoryId', 'name');

    if (!item) {
      return errorResponse('Item not found', 404);
    }

    return successResponse(item);
  } catch (error: any) {
    console.error('Get item error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

// PUT /api/items/:id - Update item (admin/warehouse_staff only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    // Only admin and warehouse_staff can update items
    if (authResult.user?.role !== 'admin' && authResult.user?.role !== 'warehouse_staff') {
      return errorResponse('Forbidden - Admin or warehouse staff only', 403);
    }

    await dbConnect();

    const { id } = await params;
    const body = await req.json();
    const { name, categoryId, unit, description } = body;

    const item = await Item.findById(id);
    if (!item) {
      return errorResponse('Item not found', 404);
    }

    // Update fields if provided
    if (name) item.name = name;
    if (categoryId) item.categoryId = categoryId;
    if (unit) item.unit = unit;
    if (description !== undefined) item.description = description;

    await item.save();

    const updatedItem = await Item.findById(id).populate('categoryId', 'name');

    return successResponse(updatedItem, 'Item updated successfully');
  } catch (error: any) {
    console.error('Update item error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

// DELETE /api/items/:id - Delete item (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    // Only admin can delete items
    if (authResult.user?.role !== 'admin') {
      return errorResponse('Forbidden - Admin only', 403);
    }

    await dbConnect();

    const { id } = await params;

    const item = await Item.findById(id);
    if (!item) {
      return errorResponse('Item not found', 404);
    }

    // Delete related stocks and stock logs first
    await Stock.deleteMany({ itemId: id });
    await StockLog.deleteMany({ itemId: id });

    // Delete the item
    await Item.findByIdAndDelete(id);

    return successResponse({ deletedId: id }, 'Item and related data deleted successfully');
  } catch (error: any) {
    console.error('Delete item error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
