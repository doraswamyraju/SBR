const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const users = [
  {
    name: 'Admin User',
    email: 'admin@sbr.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '1234567890'
  },
  {
    name: 'Agent Two',
    email: 'agent2@sbr.com',
    password: 'agent123',
    role: 'AGENT',
    phone: '1234567891',
    specialization: 'Solar Installer'
  },
  {
    name: 'Store In-Charge',
    email: 'store@sbr.com',
    password: 'store123',
    role: 'STORE_INCHARGE',
    phone: '1234567899'
  },
  {
    name: 'Customer One',
    email: 'customer1@sbr.com',
    password: 'customer123',
    role: 'CUSTOMER',
    phone: '1234567892',
    address: '123 Main Street'
  }
];

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sbr_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected.');

    for (const u of users) {
      const user = await User.findOne({ email: u.email });
      if (user) {
        user.password = u.password;
        user.role = u.role;
        user.name = u.name;
        if (u.phone) user.phone = u.phone;
        if (u.specialization) user.specialization = u.specialization;
        if (u.address) user.address = u.address;
        await user.save();
        console.log(`Updated user & reset password for: ${u.email} (${u.role}) -> password: ${u.password}`);
      } else {
        await User.create(u);
        console.log(`User created: ${u.email} (${u.role}) -> password: ${u.password}`);
      }
    }

    console.log('\nAll users seeded / updated successfully:');
    console.log('----------------------------------------------------');
    console.log('Admin:          admin@sbr.com    / admin123');
    console.log('Store Incharge: store@sbr.com    / store123');
    console.log('Agent:          agent2@sbr.com   / agent123');
    console.log('Customer:       customer1@sbr.com / customer123');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
