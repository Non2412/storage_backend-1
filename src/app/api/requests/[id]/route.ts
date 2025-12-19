import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Request from '@/models/Request';
import { successResponse, errorResponse } from '@/utils/responseHandler';

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

    const request = await Request.findById(id)
      .populate([
        { path: 'items.itemId', select: 'name unit categoryId' },
        { path: 'shelterId', select: 'name province district address capacity' },
        { path: 'requestedBy', select: 'name email phone' },
        { path: 'approvedBy', select: 'name' },
      ]);

    if (!request) {
      return errorResponse('Request not found', 404);
    }

    return successResponse(request);
  } catch (error: any) {
    console.error('Get request error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function PUT(
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
    const body = await req.json();

    // Only allow updates if status is pending
    const request = await Request.findById(id);
    if (!request) {
      return errorResponse('Request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse('Cannot update non-pending requests', 400);
    }

    const updatedRequest = await Request.findByIdAndUpdate(id, body, {
      new: true,
    })
      .populate([
        { path: 'items.itemId' },
        { path: 'shelterId' },
        { path: 'requestedBy' },
      ]);

    return successResponse(updatedRequest, 'Request updated successfully');
  } catch (error: any) {
    console.error('Update request error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
