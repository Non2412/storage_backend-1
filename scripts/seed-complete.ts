import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import User from '../src/models/User';
import Category from '../src/models/Category';
import Item from '../src/models/Item';
import Warehouse from '../src/models/Warehouse';
import Shelter from '../src/models/Shelter';
import Stock from '../src/models/Stock';
import RequestModel from '../src/models/Request';

dotenv.config({ path: '.env.local' });

async function seedDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.local');
    }

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Warehouse.deleteMany({});
    await Shelter.deleteMany({});
    await Category.deleteMany({});
    await Item.deleteMany({});
    await Stock.deleteMany({});
    await RequestModel.deleteMany({});
    console.log('✅ Cleared all data\n');

    // ========== 1. Create Warehouses ==========
    console.log('📦 Creating Warehouses...');
    const warehouses = await Warehouse.insertMany([
      {
        name: 'Warehouse Bangkok',
        province: 'Bangkok',
        address: '123 Industrial Zone, Bangkok',
        managerName: 'Somchai Thong',
        phone: '0812345678',
      },
      {
        name: 'Warehouse Chiang Mai',
        province: 'Chiang Mai',
        address: '456 North Industrial Zone, Chiang Mai',
        managerName: 'Niran Phet',
        phone: '0812345679',
      },
    ]);
    console.log(`✅ Created ${warehouses.length} warehouses\n`);

    // ========== 2. Create Shelters ==========
    console.log('🏠 Creating Shelters...');
    const shelters = await Shelter.insertMany([
      {
        name: 'Shelter Bangkok Central',
        province: 'Bangkok',
        district: 'Pathumwan',
        address: 'Emergency Center, Bangkok',
        capacity: 500,
        currentPeople: 250,
        status: 'normal',
        contactName: 'Prapass Mee',
        contactPhone: '0898765432',
        latitude: 13.7563,
        longitude: 100.5018,
      },
      {
        name: 'Shelter Bangkok East',
        province: 'Bangkok',
        district: 'Prakanong',
        address: 'Community Center East, Bangkok',
        capacity: 300,
        currentPeople: 240,
        status: 'nearly_full',
        contactName: 'Niran Kong',
        contactPhone: '0898765433',
        latitude: 13.6921,
        longitude: 100.5719,
      },
      {
        name: 'Shelter Chiang Mai North',
        province: 'Chiang Mai',
        district: 'Muang',
        address: 'Sport Complex, Chiang Mai',
        capacity: 400,
        currentPeople: 150,
        status: 'normal',
        contactName: 'Sommai Khun',
        contactPhone: '0898765434',
        latitude: 18.7883,
        longitude: 98.9853,
      },
    ]);
    console.log(`✅ Created ${shelters.length} shelters\n`);

    // ========== 3. Create Users ==========
    console.log('👥 Creating Users...');
    const hashPassword = async (password: string) => {
      return await bcryptjs.hash(password, 10);
    };

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@sisaket.go.th',
        username: 'admin',
        password: await hashPassword('admin123'),
        role: 'admin',
        phone: '0800000001',
      },
      {
        name: 'Warehouse Manager',
        email: 'warehouse@test.com',
        username: 'warehouse',
        password: await hashPassword('warehouse123'),
        role: 'warehouse_staff',
        phone: '0800000002',
        warehouseId: warehouses[0]._id,
      },
      {
        name: 'Shelter Staff Bangkok Central',
        email: 'shelter1@test.com',
        username: 'shelter1',
        password: await hashPassword('shelter123'),
        role: 'shelter_staff',
        phone: '0800000003',
        shelterId: shelters[0]._id,
      },
      {
        name: 'Shelter Staff Bangkok East',
        email: 'shelter2@test.com',
        username: 'shelter2',
        password: await hashPassword('shelter123'),
        role: 'shelter_staff',
        phone: '0800000004',
        shelterId: shelters[1]._id,
      },
      {
        name: 'Shelter Staff Chiang Mai',
        email: 'shelter3@test.com',
        username: 'shelter3',
        password: await hashPassword('shelter123'),
        role: 'shelter_staff',
        phone: '0800000005',
        shelterId: shelters[2]._id,
      },
    ]);
    console.log(`✅ Created ${users.length} users\n`);
    console.log('📝 User Credentials:');
    users.forEach((user: any) => {
      console.log(`   📧 ${user.email} | 🔑 ${user.username}@${user.role}`);
    });
    console.log('');

    // ========== 4. Create Categories ==========
    console.log('🏷️ Creating Categories...');
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
        name: 'อุปกรณ์ครัวเรือน',
        description: 'อุปกรณ์ครัวเรือนและอื่นๆ',
        icon: '🧺',
      },
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // ========== 5. Create Items ==========
    console.log('📦 Creating Items...');
    const items = await Item.insertMany([
      // Food
      {
        name: 'Rice 10kg',
        categoryId: categories[0]._id,
        unit: 'box',
        description: 'Rice 10 kilograms per box',
      },
      {
        name: 'Water 1.5L',
        categoryId: categories[0]._id,
        unit: 'piece',
        description: 'Bottled drinking water 1.5 liters',
      },
      {
        name: 'Milk 1L',
        categoryId: categories[0]._id,
        unit: 'piece',
        description: 'Pasteurized milk 1 liter',
      },
      {
        name: 'Bread',
        categoryId: categories[0]._id,
        unit: 'pack',
        description: 'Packaged bread',
      },
      {
        name: 'Eggs',
        categoryId: categories[0]._id,
        unit: 'box',
        description: 'Fresh eggs 10 pieces',
      },
      // Medicine
      {
        name: 'Paracetamol 500mg',
        categoryId: categories[1]._id,
        unit: 'box',
        description: 'Pain reliever 100 tablets',
      },
      {
        name: 'Anti-diarrheal',
        categoryId: categories[1]._id,
        unit: 'piece',
        description: 'Anti-diarrheal 100ml bottle',
      },
      {
        name: 'First Aid Kit',
        categoryId: categories[1]._id,
        unit: 'box',
        description: 'Complete first aid kit',
      },
      // Clothing
      {
        name: 'Blanket',
        categoryId: categories[2]._id,
        unit: 'piece',
        description: 'Warm blanket',
      },
      {
        name: 'T-Shirt',
        categoryId: categories[2]._id,
        unit: 'piece',
        description: 'Cotton t-shirt size L',
      },
      {
        name: 'Pants',
        categoryId: categories[2]._id,
        unit: 'piece',
        description: 'Long pants',
      },
      // Household
      {
        name: 'Soap',
        categoryId: categories[3]._id,
        unit: 'pack',
        description: 'Bath soap 100g',
      },
      {
        name: 'Toothbrush',
        categoryId: categories[3]._id,
        unit: 'piece',
        description: 'Soft toothbrush',
      },
      {
        name: 'Towel',
        categoryId: categories[3]._id,
        unit: 'piece',
        description: '100% cotton towel',
      },
      {
        name: 'LED Flashlight',
        categoryId: categories[3]._id,
        unit: 'piece',
        description: 'LED flashlight with battery',
      },
    ]);
    console.log(`✅ Created ${items.length} items\n`);

    // ========== 6. Create Stocks ==========
    console.log('📊 Creating Stocks...');
    const stocks = await Stock.insertMany([
      // Warehouse Bangkok
      {
        itemId: items[0]._id, // Rice
        warehouseId: warehouses[0]._id,
        quantity: 1000,
        unit: 'box',
      },
      {
        itemId: items[1]._id, // Water
        warehouseId: warehouses[0]._id,
        quantity: 5000,
        unit: 'piece',
      },
      {
        itemId: items[8]._id, // Blanket
        warehouseId: warehouses[0]._id,
        quantity: 500,
        unit: 'piece',
      },
      {
        itemId: items[5]._id, // Paracetamol
        warehouseId: warehouses[0]._id,
        quantity: 200,
        unit: 'box',
      },
      {
        itemId: items[11]._id, // Soap
        warehouseId: warehouses[0]._id,
        quantity: 1000,
        unit: 'pack',
      },
      // Warehouse Chiang Mai
      {
        itemId: items[0]._id, // Rice
        warehouseId: warehouses[1]._id,
        quantity: 800,
        unit: 'box',
      },
      {
        itemId: items[1]._id, // Water
        warehouseId: warehouses[1]._id,
        quantity: 3000,
        unit: 'piece',
      },
      {
        itemId: items[3]._id, // Bread
        warehouseId: warehouses[1]._id,
        quantity: 600,
        unit: 'pack',
      },
      {
        itemId: items[8]._id, // Blanket
        warehouseId: warehouses[1]._id,
        quantity: 300,
        unit: 'piece',
      },
    ]);
    console.log(`✅ Created ${stocks.length} stock entries\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SEED DATA COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Warehouses: ${warehouses.length}`);
    console.log(`   • Shelters: ${shelters.length}`);
    console.log(`   • Categories: ${categories.length}`);
    console.log(`   • Items: ${items.length}`);
    console.log(`   • Stocks: ${stocks.length}`);
    console.log('\n🚀 Ready to test API!\n');
    console.log('📝 TEST CREDENTIALS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('🔐 Admin:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123\n');
    console.log('🏭 Warehouse Staff:');
    console.log('   Email: warehouse@test.com');
    console.log('   Password: warehouse123\n');
    console.log('🏠 Shelter Staff (3 accounts):');
    console.log('   📧 shelter1@test.com / 🔑 shelter123 (Bangkok Central)');
    console.log('   📧 shelter2@test.com / 🔑 shelter123 (Bangkok East)');
    console.log('   📧 shelter3@test.com / 🔑 shelter123 (Chiang Mai)');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
