import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { authenticate } from '@/lib/auth';
import Stock from '@/models/Stock';
import { successResponse, errorResponse } from '@/utils/responseHandler';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (!authResult.authenticated) {
      return authResult.response || errorResponse('Unauthorized', 401);
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const categoryId = searchParams.get('categoryId');

    let query: any = {};
    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    let stocks = await Stock.find(query)
      .populate({
        path: 'itemId',
        populate: {
          path: 'categoryId',
          select: 'name',
        },
      })
      .populate('warehouseId', 'name province')
      .sort({ 'itemId.name': 1 });

    // Filter by categoryId if provided
    if (categoryId) {
      stocks = stocks.filter((stock: any) => 
        stock.itemId?.categoryId?._id?.toString() === categoryId
      );
    }

    // Transform data for frontend
    const transformedStocks = stocks.map((stock: any) => ({
      _id: stock._id,
      item: {
        _id: stock.itemId?._id,
        name: stock.itemId?.name,
        unit: stock.itemId?.unit,
        description: stock.itemId?.description,
        category: stock.itemId?.categoryId?.name,
        categoryId: stock.itemId?.categoryId?._id,
      },
      warehouse: {
        _id: stock.warehouseId?._id,
        name: stock.warehouseId?.name,
        province: stock.warehouseId?.province,
      },
      quantity: stock.quantity,
      minAlert: stock.minAlert,
      status: stock.quantity <= stock.minAlert ? 'low' : 'normal',
      percentage: stock.minAlert > 0 ? Math.round((stock.quantity / (stock.minAlert * 2)) * 100) : 100,
    }));

    return successResponse(transformedStocks);
  } catch (error: any) {
    console.error('Get stocks error:', error);
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
      return errorResponse('Only admin or warehouse staff can manage stocks', 403);
    }

    await dbConnect();
    const body = await req.json();
    const { warehouseId, itemId, quantity, minAlert } = body;

    if (!warehouseId || !itemId) {
      return errorResponse('warehouseId and itemId are required', 400);
    }

    // Check if stock exists, update or create
    let stock = await Stock.findOne({ warehouseId, itemId });
    
    if (stock) {
      stock.quantity = quantity ?? stock.quantity;
      stock.minAlert = minAlert ?? stock.minAlert;
      await stock.save();
    } else {
      stock = await Stock.create({
        warehouseId,
        itemId,
        quantity: quantity || 0,
        minAlert: minAlert || 10,
      });
    }

    await stock.populate([
      { path: 'itemId', populate: { path: 'categoryId', select: 'name' } },
      { path: 'warehouseId', select: 'name province' },
    ]);

    return successResponse(stock, 'Stock updated successfully');
  } catch (error: any) {
    console.error('Update stock error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
