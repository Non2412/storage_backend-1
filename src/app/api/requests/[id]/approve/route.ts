import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Request from '@/models/Request';
import Stock from '@/models/Stock';
import StockLog from '@/models/StockLog';
import Notification from '@/models/Notification';
import { errorResponse, successResponse } from '@/utils/responseHandler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    if (authResult.user?.role !== 'warehouse_staff' && authResult.user?.role !== 'admin') {
      return errorResponse('Only warehouse staff can approve requests', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { items, warehouseId } = body;

    // Find request
    const request = await Request.findById(id);
    if (!request) {
      return errorResponse('Request not found', 404);
    }

    if (request.status !== 'pending') {
      return errorResponse('Request is not pending', 400);
    }

    // ตรวจสอบสต็อกและอนุมัติ
    for (const item of items) {
      const stock = await Stock.findOne({
        itemId: item.itemId,
        warehouseId,
      });

      if (!stock) {
        return errorResponse(
          `Item not found in warehouse stock`,
          400,
          { itemId: item.itemId }
        );
      }

      if (stock.quantity < item.quantityApproved) {
        return errorResponse(
          `Insufficient stock for item ${item.itemId}`,
          400,
          { available: stock.quantity, requested: item.quantityApproved }
        );
      }

      // Update approved quantity
      const requestItem = request.items.find(
        (ri: any) => ri.itemId.toString() === item.itemId
      );
      if (requestItem) {
        requestItem.quantityApproved = item.quantityApproved;
      }
    }

    request.status = 'approved';
    request.approvedBy = authResult.user.userId;
    await request.save();

    // Create notification
    await Notification.create({
      type: 'request_approved',
      title: 'Request Approved',
      message: `Your request has been approved`,
      relatedId: request._id,
      targetUserId: request.requestedBy,
    });

    return successResponse(request, 'Request approved successfully');
  } catch (error: any) {
    console.error('Approve request error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
