import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Item from '@/models/Item';
import Stock from '@/models/Stock';
import Category from '@/models/Category';
import { successResponse, errorResponse } from '@/utils/responseHandler';

// POST /api/inventory/bulk - นำเข้า inventory หลายรายการ
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    // Only admin and warehouse_staff can bulk import
    if (authResult.user?.role !== 'admin' && authResult.user?.role !== 'warehouse_staff') {
      return errorResponse('Forbidden - Admin or warehouse staff only', 403);
    }

    await dbConnect();

    const body = await req.json();
    const { warehouseId, items } = body;

    if (!warehouseId || !items || items.length === 0) {
      return errorResponse('กรุณาระบุ warehouseId และข้อมูลสิ่งของ', 400);
    }

    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // 1. หา Category ถ้าระบุมา
        let categoryId = null;
        if (item.category || item.categoryName) {
          const categoryName = item.category || item.categoryName;
          let category = await Category.findOne({ name: categoryName });
          if (!category) {
            // สร้าง category ใหม่ถ้าไม่มี
            category = await Category.create({
              name: categoryName,
              description: `หมวดหมู่ ${categoryName}`
            });
          }
          categoryId = category._id;
        } else {
          // ใช้ category แรกที่หาเจอเป็น default
          const defaultCategory = await Category.findOne();
          categoryId = defaultCategory?._id;
        }

        // 2. สร้าง Item ถ้ายังไม่มี
        let existingItem = await Item.findOne({ name: item.name });
        if (!existingItem) {
          existingItem = await Item.create({
            name: item.name,
            unit: item.unit || 'ชิ้น',
            categoryId: categoryId,
            description: item.description || ''
          });
          insertedCount++;
        }

        // 3. เพิ่ม/อัพเดท Stock
        const existingStock = await Stock.findOne({ 
          warehouseId, 
          itemId: existingItem._id 
        });

        if (existingStock) {
          // อัพเดท quantity
          existingStock.quantity += parseInt(item.quantity) || 0;
          if (item.minAlert) {
            existingStock.minAlert = parseInt(item.minAlert);
          }
          await existingStock.save();
          updatedCount++;
        } else {
          // สร้าง stock ใหม่
          await Stock.create({
            warehouseId,
            itemId: existingItem._id,
            quantity: parseInt(item.quantity) || 0,
            minAlert: parseInt(item.minAlert) || 10
          });
        }
      } catch (itemError: any) {
        errors.push(`${item.name}: ${itemError.message}`);
      }
    }

    return successResponse({
      inserted: insertedCount,
      updated: updatedCount,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined
    }, `นำเข้าสำเร็จ ${insertedCount} รายการใหม่, อัพเดท ${updatedCount} รายการ`);

  } catch (error: any) {
    console.error('Bulk inventory import error:', error);
    return errorResponse(error.message || 'Server error', 500);
  }
}
