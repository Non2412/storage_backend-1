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

    // ตรวจสอบสิทธิ์ (admin หรือ warehouse_staff เท่านั้น)
    if (authResult.user?.role !== 'warehouse_staff' && authResult.user?.role !== 'admin') {
      return errorResponse('Only warehouse staff or admin can reject requests', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { reason } = body; // เหตุผลในการปฏิเสธ (optional)

    // ค้นหาคำร้อง
    const request = await Request.findById(id);
    if (!request) {
      return errorResponse('Request not found', 404);
    }

    // ตรวจสอบว่าเป็น pending หรือไม่
    if (request.status !== 'pending') {
      return errorResponse('Can only reject pending requests', 400);
    }

    // อัพเดทสถานะเป็น rejected
    request.status = 'rejected';
    request.rejectionReason = reason || 'ปฏิเสธโดยแอดมิน';
    request.rejectedBy = authResult.user.userId;
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
