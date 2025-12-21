import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Item from '@/models/Item';
import { successResponse, errorResponse } from '@/utils/responseHandler';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    let query: any = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const items = await Item.find(query)
      .populate('categoryId', 'name description')
      .sort({ name: 1 });

    return successResponse(items);
  } catch (error: any) {
    console.error('Get items error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    if (authResult.user?.role !== 'admin' && authResult.user?.role !== 'warehouse_staff') {
      return errorResponse('Only admin or warehouse staff can create items', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { name, categoryId, unit, description } = body;

    if (!name || !categoryId) {
      return errorResponse('name and categoryId are required', 400);
    }

    const newItem = await Item.create({
      name,
      categoryId,
      unit: unit || 'piece',
      description,
    });

    await newItem.populate('categoryId', 'name description');

    return successResponse(newItem, 'Item created successfully', 201);
  } catch (error: any) {
    console.error('Create item error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
