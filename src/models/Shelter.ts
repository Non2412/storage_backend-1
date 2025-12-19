import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    currentPeople: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['normal', 'nearly_full', 'full', 'active', 'inactive', 'closed'],
      default: 'normal',
    },
    shelterType: {
      type: String,
      enum: ['ศูนย์พักพิงหลัก', 'บ้านญาติ'],
      default: 'ศูนย์พักพิงหลัก',
    },
    contactName: String,
    contactPhone: String,
    latitude: Number,
    longitude: Number,
  },
  { timestamps: true }
);

// Virtual field สำหรับคำนวณ percentage
shelterSchema.virtual('occupancyPercentage').get(function () {
  return Math.round((this.currentPeople / this.capacity) * 100);
});

// Pre-save middleware เพื่อ update status
shelterSchema.pre('save', function (next) {
  const percentage = (this.currentPeople / this.capacity) * 100;
  
  if (percentage >= 100) {
    this.status = 'full';
  } else if (percentage >= 80) {
    this.status = 'nearly_full';
  } else {
    this.status = 'normal';
  }
  
  next();
});

export default mongoose.models.Shelter ||
  mongoose.model('Shelter', shelterSchema);
