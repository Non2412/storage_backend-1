import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Warehouse from '@/models/Warehouse';
import { successResponse, errorResponse } from '@/utils/responseHandler';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const warehouses = await Warehouse.find().sort({ name: 1 });

    return successResponse(warehouses);
  } catch (error: any) {
    console.error('Get warehouses error:', error);
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
      return errorResponse('Only admin can create warehouses', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { name, province, address, managerName, phone } = body;

    if (!name || !province || !address) {
      return errorResponse('name, province and address are required', 400);
    }

    const newWarehouse = await Warehouse.create({
      name,
      province,
      address,
      managerName,
      phone,
    });

    return successResponse(newWarehouse, 'Warehouse created successfully', 201);
  } catch (error: any) {
    console.error('Create warehouse error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
