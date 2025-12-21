import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Category from '@/models/Category';
import { successResponse, errorResponse } from '@/utils/responseHandler';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const categories = await Category.find().sort({ name: 1 });

    return successResponse(categories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    if (authResult.user?.role !== 'admin') {
      return errorResponse('Only admin can create categories', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return errorResponse('name is required', 400);
    }

    const newCategory = await Category.create({
      name,
      description,
    });

    return successResponse(newCategory, 'Category created successfully', 201);
  } catch (error: any) {
    console.error('Create category error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
