export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Request from '@/models/Request';
import Stock from '@/models/Stock';
import Item from '@/models/Item';
import Shelter from '@/models/Shelter';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/utils/responseHandler';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    if (authResult.user?.role !== 'shelter_staff') {
      return errorResponse('Only shelter staff can submit requests', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { shelterId, items } = body;

    // Validate input
    if (!shelterId || !items || items.length === 0) {
      return errorResponse('shelterId and items are required', 400);
    }

    // ตรวจสอบว่าศูนย์พักพิงมีจริงหรือไม่ (เพิ่มการ import Shelter ถ้าต้องการ)
    
    // สร้าง request ใหม่
    const newRequest = new Request({
      shelterId,
      requestedBy: authResult.user.userId,
      items: items.map((item: any) => ({
        itemId: item.itemId,
        quantityRequested: item.quantityRequested,
      })),
    });

    await newRequest.save();
    await newRequest.populate([
      { path: 'items.itemId', select: 'name unit' },
      { path: 'shelterId', select: 'name' },
      { path: 'requestedBy', select: 'name email' },
    ]);

    return successResponse(newRequest, 'Request submitted successfully', 201);
  } catch (error: any) {
    console.error('Submit request error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const shelterId = searchParams.get('shelterId');

    let query: any = {};
    if (status) query.status = status;
    if (shelterId) query.shelterId = shelterId;

    const requests = await Request.find(query)
      .populate([
        { path: 'items.itemId', select: 'name unit' },
        { path: 'shelterId', select: 'name' },
        { path: 'requestedBy', select: 'name email' },
        { path: 'approvedBy', select: 'name' },
      ])
      .sort({ createdAt: -1 });

    return successResponse(requests);
  } catch (error: any) {
    console.error('Get requests error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
