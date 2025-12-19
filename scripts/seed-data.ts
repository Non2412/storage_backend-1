import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Import Models
import Category from '../src/models/Category';
import Item from '../src/models/Item';
import Warehouse from '../src/models/Warehouse';
import Stock from '../src/models/Stock';
import Shelter from '../src/models/Shelter';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '', {
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Warehouse.deleteMany({});
    await Stock.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // 1. Create Categories
    const categories = await Category.insertMany([
      {
        name: 'อาหาร',
        description: 'อาหารและเครื่องดื่ม',
        icon: '🍚',
      },
      {
        name: 'ยา',
        description: 'ยาและอุปกรณ์การแพทย์',
        icon: '💊',
      },
      {
        name: 'เสื้อผ้า',
        description: 'เสื้อผ้าและผ้าใบ',
        icon: '👕',
      },
      {
        name: 'อุปกรณ์สำเร็จ',
        description: 'อุปกรณ์ครัวเรือนและอื่นๆ',
        icon: '🧺',
      },
      {
        name: 'น้ำและสุขาภิบาล',
        description: 'น้ำบริสุทธิ์และสินค้าสุขาภิบาล',
        icon: '💧',
      },
    ]);
    console.log('✅ Created 5 categories');

    // 2. Create Items
    const items = await Item.insertMany([
      {
        name: 'ข้าวสาร 10 กก.',
        categoryId: categories[0]._id,
        unit: 'ถุง',
        description: 'ข้าวสาร 10 กิโลกรัม',
        minAlert: 50,
      },
      {
        name: 'น้ำดื่ม 1.5 ลิตร',
        categoryId: categories[0]._id,
        unit: 'ขวด',
        description: 'น้ำดื่มบรรจุขวด 1.5 ลิตร',
        minAlert: 200,
      },
      {
        name: 'นมสด 1 ลิตร',
        categoryId: categories[0]._id,
        unit: 'เพ็ก',
        description: 'นมสดพาสเจอร์ไรซ์ 1 ลิตร',
        minAlert: 100,
      },
      {
        name: 'ขนมปัง',
        categoryId: categories[0]._id,
        unit: 'แพ็ค',
        description: 'ขนมปังสำเร็จรูป 1 แพ็ค',
        minAlert: 150,
      },
      {
        name: 'ไข่ไก่',
        categoryId: categories[0]._id,
        unit: 'สิบ',
        description: 'ไข่ไก่สด 10 ฟอง',
        minAlert: 80,
      },
      {
        name: 'พาราเซตามอล 500 mg',
        categoryId: categories[1]._id,
        unit: 'กระปุก',
        description: 'ยาลดไข้ 100 เม็ด',
        minAlert: 30,
      },
      {
        name: 'ประชาสัมพันธ์สนับสนุน',
        categoryId: categories[1]._id,
        unit: 'กล่อง',
        description: 'หน้ากากอนามัยและสารฆ่าเชื้อ',
        minAlert: 50,
      },
      {
        name: 'ผ้าใบ 5 เมตร',
        categoryId: categories[2]._id,
        unit: 'ม้วน',
        description: 'ผ้าใบสีน้ำเงิน 5 เมตร',
        minAlert: 20,
      },
      {
        name: 'เสื้อยืดผู้ใหญ่',
        categoryId: categories[2]._id,
        unit: 'ตัว',
        description: 'เสื้อยืดคอกลม ไซส์ M-XL',
        minAlert: 50,
      },
      {
        name: 'กางเกงขายาว',
        categoryId: categories[2]._id,
        unit: 'ตัว',
        description: 'กางเกงขายาวผ้า Cotton ไซส์ 32-38',
        minAlert: 40,
      },
      {
        name: 'หมอน',
        categoryId: categories[3]._id,
        unit: 'ใบ',
        description: 'หมอนสำเร็จรูป 1 ใบ',
        minAlert: 30,
      },
      {
        name: 'ผ้าเช็ดตัว',
        categoryId: categories[3]._id,
        unit: 'ผืน',
        description: 'ผ้าเช็ดตัวสีขาว',
        minAlert: 100,
      },
      {
        name: 'สบู่',
        categoryId: categories[4]._id,
        unit: 'ก้อน',
        description: 'สบู่อาบน้ำ 1 ก้อน',
        minAlert: 200,
      },
      {
        name: 'แชมพู',
        categoryId: categories[4]._id,
        unit: 'ขวด',
        description: 'แชมพู 200 มิลลิลิตร',
        minAlert: 80,
      },
    ]);
    console.log('✅ Created 14 items');

    // 3. Create Warehouses
    const warehouses = await Warehouse.insertMany([
      {
        name: 'โกดัง Central Bangkok',
        province: 'Bangkok',
        address: '123 Rama IX Road, Bangkok',
        managerName: 'นายสมชาย',
        phone: '0812345678',
      },
      {
        name: 'โกดัง Northern Region',
        province: 'Chiang Mai',
        address: '456 Huay Kaew Road, Chiang Mai',
        managerName: 'นายประสิทธิ์',
        phone: '0899887766',
      },
      {
        name: 'โกดัง Eastern Region',
        province: 'Rayong',
        address: '789 Sukhumvit Road, Rayong',
        managerName: 'นายวิษณุ',
        phone: '0845112233',
      },
    ]);
    console.log('✅ Created 3 warehouses');

    // 4. Create Stocks
    const stocks = [];
    for (const warehouse of warehouses) {
      for (const item of items) {
        stocks.push({
          warehouseId: warehouse._id,
          itemId: item._id,
          quantity: Math.floor(Math.random() * 500) + 100,
          minAlert: item.minAlert,
        });
      }
    }
    await Stock.insertMany(stocks);
    console.log(`✅ Created ${stocks.length} stock records`);

    // 5. Create Shelters (if not already created)
    const existingShelters = await Shelter.countDocuments();
    if (existingShelters === 0) {
      const sheltersData = [
        {
          name: 'ศูนย์อพยพ หลวงพ่อ หัวหิน',
          province: 'Prachuap Khiri Khan',
          district: 'Hua Hin',
          address: 'วัดหลวงพ่อ',
          capacity: 500,
          currentPeople: 250,
          contactName: 'นายสมศักดิ์',
          contactPhone: '0812223334',
          latitude: 12.5688,
          longitude: 99.9558,
        },
        {
          name: 'ศูนย์อพยพ โรงเรียนบ้านเชียง',
          province: 'Chiang Mai',
          district: 'Muang',
          address: 'โรงเรียนบ้านเชียง',
          capacity: 400,
          currentPeople: 180,
          contactName: 'นายวิรัช',
          contactPhone: '0823334445',
          latitude: 18.7883,
          longitude: 98.9853,
        },
        {
          name: 'ศูนย์อพยพ สนามกีฬา',
          province: 'Bangkok',
          district: 'Pathumwan',
          address: 'สนามกีฬา Lumpini',
          capacity: 1000,
          currentPeople: 450,
          contactName: 'นายประสูติ',
          contactPhone: '0834445556',
          latitude: 13.7315,
          longitude: 100.5447,
        },
        {
          name: 'ศูนย์อพยพ โรงแรมเชียงใหม่',
          province: 'Chiang Mai',
          district: 'Muang',
          address: 'โรงแรมวังขวาง',
          capacity: 300,
          currentPeople: 120,
          contactName: 'นางสาวพิมพ์',
          contactPhone: '0845556667',
          latitude: 18.8214,
          longitude: 98.9889,
        },
        {
          name: 'ศูนย์อพยพ โรงพยาบาลส่วนท้องถิ่น',
          province: 'Nakhon Sawan',
          district: 'Muang',
          address: 'โรงพยาบาลสรรพสิทธิประชา',
          capacity: 350,
          currentPeople: 200,
          contactName: 'นายสุรพล',
          contactPhone: '0856667778',
          latitude: 15.8161,
          longitude: 100.1360,
        },
        {
          name: 'ศูนย์อพยพ ศาลากลาง',
          province: 'Samutprakarn',
          district: 'Muang',
          address: 'ศาลากลาง อ.เมือง',
          capacity: 280,
          currentPeople: 140,
          contactName: 'นายอนุชา',
          contactPhone: '0867778889',
          latitude: 13.5478,
          longitude: 100.7194,
        },
        {
          name: 'ศูนย์อพยพ วัดพระแก้ว',
          province: 'Ayutthaya',
          district: 'Phra Nakhon Si Ayutthaya',
          address: 'วัดพระแก้ว',
          capacity: 320,
          currentPeople: 160,
          contactName: 'พระ ธีระสิทธิ์',
          contactPhone: '0878889990',
          latitude: 14.3559,
          longitude: 100.7638,
        },
        {
          name: 'ศูนย์อพยพ โรงเรียนกำแพงแสน',
          province: 'Kanchanaburi',
          district: 'Muang',
          address: 'โรงเรียนกำแพงแสน',
          capacity: 400,
          currentPeople: 220,
          contactName: 'นายสมพงษ์',
          contactPhone: '0889990001',
          latitude: 14.0227,
          longitude: 99.5341,
        },
        {
          name: 'ศูนย์อพยพ สนามกีฬา ระยอง',
          province: 'Rayong',
          district: 'Muang',
          address: 'สนามกีฬาเอกชน',
          capacity: 350,
          currentPeople: 175,
          contactName: 'นายวิทยา',
          contactPhone: '0890001112',
          latitude: 12.6819,
          longitude: 101.2617,
        },
        {
          name: 'ศูนย์อพยพ โรงแรมระดับมัธยม',
          province: 'Phetchaburi',
          district: 'Muang',
          address: 'โรงแรมทะเลพัทยา',
          capacity: 280,
          currentPeople: 130,
          contactName: 'นายพิชิต',
          contactPhone: '0801112223',
          latitude: 13.1139,
          longitude: 100.3891,
        },
      ];

      await Shelter.insertMany(sheltersData);
      console.log('✅ Created 10 shelters');
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log(`   • Categories: ${categories.length}`);
    console.log(`   • Items: ${items.length}`);
    console.log(`   • Warehouses: ${warehouses.length}`);
    console.log(`   • Stocks: ${stocks.length}`);
    console.log(`   • Shelters: ${existingShelters > 0 ? '(already existed)' : '10 (newly created)'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
