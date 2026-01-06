import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Request from '@/models/Request';
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
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();
    const body = await req.json();
    const { reason } = body; // เหตุผลในการปฏิเสธ (optional)

    // ค้นหาคำร้อง
    const request = await Request.findById(id);
    if (!request) {
      return errorResponse('Request not found', 404);
    }

    // ตรวจสอบสิทธิ์
    const isAdminOrWarehouse = authResult.user?.role === 'warehouse_staff' || authResult.user?.role === 'admin';
    const isOwner = request.requestedBy.toString() === authResult.user?.userId;

    // อนุญาตให้:
    // 1. admin/warehouse_staff ปฏิเสธคำร้องใดก็ได้
    // 2. shelter_staff ยกเลิกคำร้องของตัวเอง
    if (!isAdminOrWarehouse && !isOwner) {
      return errorResponse('You can only cancel your own requests', 403);
    }

    // ตรวจสอบว่าเป็น pending หรือไม่
    if (request.status !== 'pending') {
      return errorResponse('Can only reject/cancel pending requests', 400);
    }

    // อัพเดทสถานะเป็น rejected
    request.status = 'rejected';
    request.rejectionReason = isOwner && !isAdminOrWarehouse 
      ? reason || 'ยกเลิกโดยผู้ขอ' 
      : reason || 'ปฏิเสธโดยแอดมิน';
    request.rejectedBy = authResult.user!.userId;
    request.rejectedAt = new Date();
    await request.save();

    // สร้าง notification (try-catch เพื่อไม่ให้ error กรณี Notification model มีปัญหา)
    try {
      await Notification.create({
        type: 'request_rejected',
        title: 'Request Rejected',
        message: `Your request has been rejected. Reason: ${reason || 'ไม่ระบุเหตุผล'}`,
        relatedId: request._id,
        targetUserId: request.requestedBy,
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // ไม่ throw error เพราะ main action สำเร็จแล้ว
    }

    // Populate ข้อมูลก่อน return
    const populatedRequest = await Request.findById(id)
      .populate('shelterId', 'name province')
      .populate('requestedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('items.itemId', 'name unit');

    return successResponse(populatedRequest, 'Request rejected successfully');
  } catch (error: any) {
    console.error('Reject request error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
