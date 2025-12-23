import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import Item from '@/models/Item';
import Warehouse from '@/models/Warehouse';
import Stock from '@/models/Stock';
import StockLog from '@/models/StockLog';
import User from '@/models/User';
import Shelter from '@/models/Shelter';
import { successResponse, errorResponse } from '@/utils/responseHandler';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Check if reset is requested
    const { searchParams } = new URL(req.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      // Delete existing users created by seed
      await User.deleteMany({ 
        $or: [
          { email: { $in: ['admin@sisaket.go.th', 'warehouse@sisaket.go.th', 'shelter@sisaket.go.th'] } },
          { username: { $in: ['admin', 'admin_sisaket', 'warehouse', 'warehouse_sisaket', 'shelter_staff'] } }
        ]
      });
      
      // Delete ALL items and stocks to recreate with Thai names
      await StockLog.deleteMany({});
      await Stock.deleteMany({});
      await Item.deleteMany({});
      await Category.deleteMany({});
    }

    // 1. Create Categories
    const categories = [
      { name: 'อาหารและเครื่องดื่ม', description: 'อาหาร น้ำดื่ม เครื่องดื่ม' },
      { name: 'เสื้อผ้าและผ้าห่ม', description: 'เสื้อผ้า ผ้าห่ม ผ้าขนหนู' },
      { name: 'ยาและเวชภัณฑ์', description: 'ยา อุปกรณ์ทางการแพทย์' },
      { name: 'อุปกรณ์สุขอนามัย', description: 'สบู่ แชมพู ยาสีฟัน ของใช้ส่วนตัว' },
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
    const hygieneCategory = createdCategories.find(c => c.name === 'อุปกรณ์สุขอนามัย');

    const itemsData = [
      // อาหารและเครื่องดื่ม
      { name: 'ข้าวสาร', categoryId: foodCategory._id, unit: 'กิโลกรัม', description: 'ข้าวสารหอมมะลิ' },
      { name: 'น้ำดื่ม 1.5 ลิตร', categoryId: foodCategory._id, unit: 'แพ็ค', description: 'น้ำดื่มขวด 1.5 ลิตร แพ็ค 6' },
      { name: 'นมกล่อง', categoryId: foodCategory._id, unit: 'กล่อง', description: 'นม UHT 200ml' },
      { name: 'บะหมี่กึ่งสำเร็จรูป', categoryId: foodCategory._id, unit: 'กล่อง', description: 'บะหมี่สำเร็จรูป กล่องละ 30 ซอง' },
      { name: 'ขนมปัง', categoryId: foodCategory._id, unit: 'แพ็ค', description: 'ขนมปังแผ่น' },
      { name: 'อาหารกระป๋อง', categoryId: foodCategory._id, unit: 'กระป๋อง', description: 'ปลากระป๋อง อาหารสำเร็จรูป' },
      // เสื้อผ้าและผ้าห่ม
      { name: 'ผ้าห่ม', categoryId: clothCategory._id, unit: 'ผืน', description: 'ผ้าห่มนวม' },
      { name: 'เสื้อผ้า', categoryId: clothCategory._id, unit: 'ชิ้น', description: 'เสื้อผ้าสำเร็จรูป' },
      { name: 'ผ้าขนหนู', categoryId: clothCategory._id, unit: 'ผืน', description: 'ผ้าขนหนูขนาดใหญ่' },
      // ยาและเวชภัณฑ์
      { name: 'ยาพาราเซตามอล', categoryId: medCategory._id, unit: 'กล่อง', description: 'ยาลดไข้แก้ปวด 500mg' },
      { name: 'พลาสเตอร์', categoryId: medCategory._id, unit: 'กล่อง', description: 'พลาสเตอร์ปิดแผล' },
      { name: 'แอลกอฮอล์เจล', categoryId: medCategory._id, unit: 'ขวด', description: 'เจลล้างมือแอลกอฮอล์ 500ml' },
      { name: 'ผ้าพันแผล', categoryId: medCategory._id, unit: 'ม้วน', description: 'ผ้าพันแผลปลอดเชื้อ' },
      // อุปกรณ์สุขอนามัย
      { name: 'สบู่', categoryId: hygieneCategory._id, unit: 'ก้อน', description: 'สบู่ก้อน' },
      { name: 'แชมพู', categoryId: hygieneCategory._id, unit: 'ขวด', description: 'แชมพูสระผม' },
      { name: 'ยาสีฟัน', categoryId: hygieneCategory._id, unit: 'หลอด', description: 'ยาสีฟันขนาด 150g' },
      { name: 'แปรงสีฟัน', categoryId: hygieneCategory._id, unit: 'อัน', description: 'แปรงสีฟันสำหรับผู้ใหญ่' },
      { name: 'ผ้าอนามัย', categoryId: hygieneCategory._id, unit: 'ห่อ', description: 'ผ้าอนามัยแบบมีปีก' },
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
      // อาหารและเครื่องดื่ม
      { itemName: 'ข้าวสาร', quantity: 500, minAlert: 100 },
      { itemName: 'น้ำดื่ม 1.5 ลิตร', quantity: 200, minAlert: 50 },
      { itemName: 'นมกล่อง', quantity: 150, minAlert: 30 },
      { itemName: 'บะหมี่กึ่งสำเร็จรูป', quantity: 100, minAlert: 20 },
      { itemName: 'ขนมปัง', quantity: 80, minAlert: 20 },
      { itemName: 'อาหารกระป๋อง', quantity: 120, minAlert: 30 },
      // เสื้อผ้าและผ้าห่ม
      { itemName: 'ผ้าห่ม', quantity: 80, minAlert: 30 },
      { itemName: 'เสื้อผ้า', quantity: 150, minAlert: 50 },
      { itemName: 'ผ้าขนหนู', quantity: 100, minAlert: 30 },
      // ยาและเวชภัณฑ์
      { itemName: 'ยาพาราเซตามอล', quantity: 50, minAlert: 20 },
      { itemName: 'พลาสเตอร์', quantity: 30, minAlert: 10 },
      { itemName: 'แอลกอฮอล์เจล', quantity: 40, minAlert: 15 },
      { itemName: 'ผ้าพันแผล', quantity: 25, minAlert: 10 },
      // อุปกรณ์สุขอนามัย
      { itemName: 'สบู่', quantity: 200, minAlert: 50 },
      { itemName: 'แชมพู', quantity: 100, minAlert: 30 },
      { itemName: 'ยาสีฟัน', quantity: 100, minAlert: 30 },
      { itemName: 'แปรงสีฟัน', quantity: 150, minAlert: 40 },
      { itemName: 'ผ้าอนามัย', quantity: 80, minAlert: 20 },
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
    let adminUser = await User.findOne({ $or: [{ email: 'admin@sisaket.go.th' }, { username: 'admin' }] });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'ผู้ดูแลระบบ',
        email: 'admin@sisaket.go.th',
        username: 'admin_sisaket',
        password: 'admin123', // Model will hash this automatically
        role: 'admin',
        phone: '045-123456',
      });
    }

    // 6. Create Warehouse Staff if not exists
    let warehouseStaff = await User.findOne({ $or: [{ email: 'warehouse@sisaket.go.th' }, { username: 'warehouse' }] });
    if (!warehouseStaff) {
      warehouseStaff = await User.create({
        name: 'เจ้าหน้าที่คลัง',
        email: 'warehouse@sisaket.go.th',
        username: 'warehouse_sisaket',
        password: 'warehouse123', // Model will hash this automatically
        role: 'warehouse_staff',
        phone: '045-123457',
        warehouseId: warehouse._id,
      });
    }

    // 6.5 Create Shelter Staff if not exists
    let shelterStaff = await User.findOne({ $or: [{ email: 'shelter@sisaket.go.th' }, { username: 'shelter_staff' }] });
    if (!shelterStaff) {
      // First create a sample shelter
      let shelter = await Shelter.findOne({ name: 'ศูนย์พักพิงชั่วคราว A' });
      if (!shelter) {
        shelter = await Shelter.create({
          name: 'ศูนย์พักพิงชั่วคราว A',
          province: 'ศรีสะเกษ',
          district: 'เมือง',
          address: '456 ถนนศรีสะเกษ',
          capacity: 200,
          currentPeople: 50,
          status: 'normal',
          contactName: 'นางสาวสมหญิง ใจงาม',
          contactPhone: '045-111222',
        });
      }

      shelterStaff = await User.create({
        name: 'เจ้าหน้าที่ศูนย์พักพิง',
        email: 'shelter@sisaket.go.th',
        username: 'shelter_staff',
        password: 'shelter123', // Model will hash this automatically
        role: 'shelter_staff',
        phone: '045-123458',
        shelterId: shelter._id,
      });
    }

    // 7. Create sample Stock Logs for history
    const stockLogsCount = await StockLog.countDocuments();
    let createdLogs = 0;
    if (stockLogsCount === 0) {
      const sampleLogs = [
        { itemName: 'ข้าวสาร', changeType: 'in', quantity: 100, reason: 'รับบริจาคจากชุมชน' },
        { itemName: 'น้ำดื่ม', changeType: 'in', quantity: 50, reason: 'จัดซื้อประจำเดือน' },
        { itemName: 'ข้าวสาร', changeType: 'out', quantity: -20, reason: 'จ่ายให้ศูนย์พักพิง A' },
        { itemName: 'ผ้าห่ม', changeType: 'in', quantity: 30, reason: 'รับบริจาค' },
        { itemName: 'ยาพาราเซตามอล', changeType: 'out', quantity: -10, reason: 'จ่ายให้ศูนย์พักพิง B' },
        { itemName: 'นมกล่อง', changeType: 'in', quantity: 100, reason: 'จัดซื้อเพิ่ม' },
        { itemName: 'เสื้อผ้า', changeType: 'out', quantity: -25, reason: 'แจกจ่ายผู้ประสบภัย' },
        { itemName: 'น้ำดื่ม', changeType: 'out', quantity: -15, reason: 'ส่งไปศูนย์พักพิง C' },
      ];

      for (const logData of sampleLogs) {
        const item = createdItems.find(i => i.name === logData.itemName);
        if (item) {
          await StockLog.create({
            itemId: item._id,
            warehouseId: warehouse._id,
            changeType: logData.changeType,
            quantity: logData.quantity,
            reason: logData.reason,
            createdBy: adminUser._id,
          });
          createdLogs++;
        }
      }
    }

    return successResponse({
      message: 'Seed data created successfully',
      data: {
        categories: createdCategories.length,
        warehouse: warehouse.name,
        items: createdItems.length,
        stocks: createdStocks.length,
        stockLogs: createdLogs,
        users: {
          admin: 'admin@sisaket.go.th / admin123',
          warehouse: 'warehouse@sisaket.go.th / warehouse123',
          shelter: 'shelter@sisaket.go.th / shelter123',
        },
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return errorResponse(error.message || 'Seed failed', 500);
  }
}
