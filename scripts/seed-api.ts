#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

let adminToken = '';

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123',
    });
    adminToken = loginRes.data.data.token;
    console.log('✅ Admin login successful\n');

    // 2. Create Shelters
    console.log('🏛️ Creating 10 shelters...');
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

    for (const shelter of sheltersData) {
      try {
        await axios.post(`${BASE_URL}/shelters`, shelter, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch (error: any) {
        console.log(`  ⚠️ Shelter "${shelter.name}" already exists or error occurred`);
      }
    }
    console.log('✅ Shelters created/verified\n');

    console.log('✅ Database seeding completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log('   ✅ 10 Shelters');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:');
    console.log('   1. Get Shelter IDs: GET /api/shelters');
    console.log('   2. Use in Postman Collection');
    console.log('   3. Test Submit Request endpoint\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

seedData();
