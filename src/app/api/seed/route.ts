import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';
import Warehouse from '@/models/Warehouse';
import Stock from '@/models/Stock';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/utils/responseHandler';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Create Categories
    const categories = [
      { name: 'อาหารและเครื่องดื่ม', description: 'อาหาร น้ำดื่ม เครื่องดื่ม' },
      { name: 'เสื้อผ้าและผ้าห่ม', description: 'เสื้อผ้า ผ้าห่ม ผ้าขนหนู' },
      { name: 'ยาและเวชภัณฑ์', description: 'ยา อุปกรณ์ทางการแพทย์' },
    ];

    const createdCategories: any[] = [];
    for (const cat of categories) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        category = await Category.create(cat);
      }
      createdCategories.push(category);
    }

    // 2. Create Warehouse
    let warehouse = await Warehouse.findOne({ name: 'คลังกลาง ศรีสะเกษ' });
    if (!warehouse) {
      warehouse = await Warehouse.create({
        name: 'คลังกลาง ศรีสะเกษ',
        province: 'ศรีสะเกษ',
        address: '123 ถนนเทพา อ.เมือง จ.ศรีสะเกษ',
        managerName: 'นายสมชาย ใจดี',
        phone: '045-123456',
      });
    }

    // 3. Create Items
    const foodCategory = createdCategories.find(c => c.name === 'อาหารและเครื่องดื่ม');
    const clothCategory = createdCategories.find(c => c.name === 'เสื้อผ้าและผ้าห่ม');
    const medCategory = createdCategories.find(c => c.name === 'ยาและเวชภัณฑ์');

    const itemsData = [
      { name: 'ข้าวสาร', categoryId: foodCategory._id, unit: 'kg', description: 'ข้าวสารหอมมะลิ' },
      { name: 'น้ำดื่ม', categoryId: foodCategory._id, unit: 'box', description: 'น้ำดื่มขวด 600ml แพ็ค 12' },
      { name: 'นมกล่อง', categoryId: foodCategory._id, unit: 'box', description: 'นม UHT 200ml' },
      { name: 'บะหมี่กึ่งสำเร็จรูป', categoryId: foodCategory._id, unit: 'box', description: 'บะหมี่สำเร็จรูป กล่องละ 30 ซอง' },
      { name: 'ผ้าห่ม', categoryId: clothCategory._id, unit: 'piece', description: 'ผ้าห่มนวม' },
      { name: 'เสื้อผ้า', categoryId: clothCategory._id, unit: 'piece', description: 'เสื้อผ้าสำเร็จรูป' },
      { name: 'ผ้าขนหนู', categoryId: clothCategory._id, unit: 'piece', description: 'ผ้าขนหนูขนาดใหญ่' },
      { name: 'ยาพาราเซตามอล', categoryId: medCategory._id, unit: 'box', description: 'ยาลดไข้แก้ปวด 500mg' },
      { name: 'พลาสเตอร์', categoryId: medCategory._id, unit: 'box', description: 'พลาสเตอร์ปิดแผล' },
      { name: 'แอลกอฮอล์เจล', categoryId: medCategory._id, unit: 'piece', description: 'เจลล้างมือแอลกอฮอล์ 500ml' },
    ];

    const createdItems: any[] = [];
    for (const item of itemsData) {
      let existingItem = await Item.findOne({ name: item.name });
      if (!existingItem) {
        existingItem = await Item.create(item);
      }
      createdItems.push(existingItem);
    }

    // 4. Create Stocks
    const stocksData = [
      { itemName: 'ข้าวสาร', quantity: 500, minAlert: 100 },
      { itemName: 'น้ำดื่ม', quantity: 200, minAlert: 50 },
      { itemName: 'นมกล่อง', quantity: 150, minAlert: 30 },
      { itemName: 'บะหมี่กึ่งสำเร็จรูป', quantity: 100, minAlert: 20 },
      { itemName: 'ผ้าห่ม', quantity: 80, minAlert: 30 },
      { itemName: 'เสื้อผ้า', quantity: 150, minAlert: 50 },
      { itemName: 'ผ้าขนหนู', quantity: 100, minAlert: 30 },
      { itemName: 'ยาพาราเซตามอล', quantity: 50, minAlert: 20 },
      { itemName: 'พลาสเตอร์', quantity: 30, minAlert: 10 },
      { itemName: 'แอลกอฮอล์เจล', quantity: 40, minAlert: 15 },
    ];

    const createdStocks: any[] = [];
    for (const stockData of stocksData) {
      const item = createdItems.find(i => i.name === stockData.itemName);
      if (item) {
        let stock = await Stock.findOne({ warehouseId: warehouse._id, itemId: item._id });
        if (!stock) {
          stock = await Stock.create({
            warehouseId: warehouse._id,
            itemId: item._id,
            quantity: stockData.quantity,
            minAlert: stockData.minAlert,
          });
        } else {
          stock.quantity = stockData.quantity;
          stock.minAlert = stockData.minAlert;
          await stock.save();
        }
        createdStocks.push(stock);
      }
    }

    // 5. Create Admin User if not exists
    let adminUser = await User.findOne({ email: 'admin@sisaket.go.th' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        name: 'ผู้ดูแลระบบ',
        email: 'admin@sisaket.go.th',
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        phone: '045-123456',
      });
    }

    // 6. Create Warehouse Staff if not exists
    let warehouseStaff = await User.findOne({ email: 'warehouse@sisaket.go.th' });
    if (!warehouseStaff) {
      const hashedPassword = await bcrypt.hash('warehouse123', 10);
      warehouseStaff = await User.create({
        name: 'เจ้าหน้าที่คลัง',
        email: 'warehouse@sisaket.go.th',
        username: 'warehouse',
        password: hashedPassword,
        role: 'warehouse_staff',
        phone: '045-123457',
        warehouseId: warehouse._id,
      });
    }

    return successResponse({
      message: 'Seed data created successfully',
      data: {
        categories: createdCategories.length,
        warehouse: warehouse.name,
        items: createdItems.length,
        stocks: createdStocks.length,
        users: {
          admin: 'admin@sisaket.go.th / admin123',
          warehouse: 'warehouse@sisaket.go.th / warehouse123',
        },
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return errorResponse(error.message || 'Seed failed', 500);
  }
}
