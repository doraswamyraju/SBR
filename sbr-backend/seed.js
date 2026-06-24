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
      const userExists = await User.findOne({ email: u.email });
      if (userExists) {
        console.log(`User with email ${u.email} already exists.`);
      } else {
        await User.create(u);
        console.log(`User created: ${u.email} (${u.role})`);
      }
    }

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
