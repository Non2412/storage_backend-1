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
      return errorResponse('Only warehouse staff can transfer items', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { items, warehouseId } = body;

    // Find request
    const request = await Request.findById(id);
    if (!request) {
      return errorResponse('Request not found', 404);
    }

    if (request.status !== 'approved') {
      return errorResponse('Request must be approved first', 400);
    }

    // ตัดสต็อก และสร้าง stock logs
    for (const item of items) {
      const stock = await Stock.findOne({
        itemId: item.itemId,
        warehouseId,
      });

      if (!stock) {
        return errorResponse(`Item not found in warehouse`, 404);
      }

      if (stock.quantity < item.quantityTransferred) {
        return errorResponse(
          `Insufficient stock for transfer`,
          400,
          { itemId: item.itemId, available: stock.quantity }
        );
      }

      // Update stock
      stock.quantity -= item.quantityTransferred;
      await stock.save();

      // Create stock log
      await StockLog.create({
        itemId: item.itemId,
        warehouseId,
        changeType: 'out',
        quantity: item.quantityTransferred,
        referenceId: request._id,
        reason: `Transfer to shelter ${request.shelterId}`,
        createdBy: authResult.user.userId,
      });

      // Update request item transferred quantity
      const requestItem = request.items.find(
        (ri: any) => ri.itemId.toString() === item.itemId
      );
      if (requestItem) {
        requestItem.quantityTransferred = item.quantityTransferred;
      }

      // Alert if stock is low
      if (stock.quantity <= stock.minAlert) {
        await Notification.create({
          type: 'item_low_stock',
          title: 'Low Stock Alert',
          message: `Item stock is low (${stock.quantity} remaining)`,
          relatedId: stock._id,
          targetUserId: authResult.user.userId,
        });
      }
    }

    request.status = 'transferred';
    await request.save();

    // Create notification
    await Notification.create({
      type: 'request_approved',
      title: 'Items Transferred',
      message: `Your request items have been transferred`,
      relatedId: request._id,
      targetUserId: request.requestedBy,
    });

    return successResponse(request, 'Items transferred successfully and stock updated');
  } catch (error: any) {
    console.error('Transfer error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
