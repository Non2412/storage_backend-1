import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Shelter from '../src/models/Shelter';

dotenv.config({ path: '.env.local' });

async function importShelters() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env.local');
    }

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ Connected to MongoDB\n');

    // Read JSON file from Downloads
    const filePath = path.join(
      process.env.USERPROFILE || process.env.HOME || '',
      'Downloads',
      'OperationCenters_2025-12-19_14-48-11.json'
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`📂 Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    console.log(`📊 Total shelters to import: ${jsonData.data.length}\n`);

    // Clear existing shelters
    console.log('🗑️ Clearing existing shelters...');
    await Shelter.deleteMany({});
    console.log('✅ Cleared all shelters\n');

    // Transform and import data
    console.log('📥 Importing shelters...');
    const shelterData = jsonData.data.map((item: any) => ({
      name: item.name || 'Unknown',
      province: item.province || 'Unknown',
      district: item.district || 'Unknown',
      address: item.address || 'Unknown',
      capacity: item.capacity || 100,
      currentPeople: item.currentPeople || 0,
      status: item.status || 'normal',
      shelterType: item.shelterType || 'ศูนย์พักพิงหลัก',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
    }));

    // Insert in batches (500 at a time)
    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < shelterData.length; i += batchSize) {
      const batch = shelterData.slice(i, i + batchSize);
      await Shelter.insertMany(batch);
      imported += batch.length;
      console.log(`  ✓ Imported ${imported}/${shelterData.length} shelters`);
    }

    console.log(`\n✅ Successfully imported ${imported} shelters!\n`);

    // Summary
    const stats = await Shelter.aggregate([
      {
        $group: {
          _id: '$shelterType',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('📊 Shelter Type Summary:');
    stats.forEach((stat: any) => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n✅ Import completed successfully!');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing shelters:', error);
    process.exit(1);
  }
}

importShelters();
