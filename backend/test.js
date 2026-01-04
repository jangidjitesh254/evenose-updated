const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testAuth() {
  try {
    console.log('🧪 Starting Authentication Tests...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user data
    const testUser = {
      username: 'debuguser',
      email: 'debug@test.com',
      password: 'test123',
      fullName: 'Debug User',
      phone: '1234567890',
      institution: 'Test University',
      roles: ['student']
    };

    // Delete existing test user
    await User.deleteOne({ email: testUser.email });
    console.log('🗑️  Cleared existing test user\n');

    // Test 1: Create user
    console.log('Test 1: Creating user...');
    const user = await User.create(testUser);
    console.log('✅ User created successfully');
    console.log('   Email:', user.email);
    console.log('   Password (hashed):', user.password.substring(0, 30) + '...');
    console.log('   Length:', user.password.length, 'chars\n');

    // Test 2: Password hashing
    console.log('Test 2: Checking password hashing...');
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('✅ Password is properly hashed (bcrypt)\n');
    } else {
      console.log('❌ Password is NOT hashed! This is a problem!\n');
      throw new Error('Password hashing not working');
    }

    // Test 3: Password comparison - correct password
    console.log('Test 3: Testing correct password...');
    const isMatch = await user.comparePassword('test123');
    if (isMatch) {
      console.log('✅ Correct password accepted\n');
    } else {
      console.log('❌ Correct password rejected! comparePassword broken!\n');
      throw new Error('comparePassword not working');
    }

    // Test 4: Password comparison - wrong password
    console.log('Test 4: Testing wrong password...');
    const isWrong = await user.comparePassword('wrongpassword');
    if (!isWrong) {
      console.log('✅ Wrong password correctly rejected\n');
    } else {
      console.log('❌ Wrong password was accepted! Security issue!\n');
      throw new Error('Password validation broken');
    }

    // Test 5: Find user by email
    console.log('Test 5: Finding user by email...');
    const foundUser = await User.findOne({ email: testUser.email }).select('+password');
    if (foundUser) {
      console.log('✅ User found in database');
      console.log('   ID:', foundUser._id);
      console.log('   Email:', foundUser.email);
      console.log('   Username:', foundUser.username, '\n');
    } else {
      console.log('❌ User not found in database!\n');
      throw new Error('User query failed');
    }

    // Test 6: Simulate login flow
    console.log('Test 6: Simulating login flow...');
    const loginUser = await User.findOne({ email: 'debug@test.com' }).select('+password');
    if (!loginUser) {
      throw new Error('User not found for login');
    }
    
    const loginMatch = await loginUser.comparePassword('test123');
    if (loginMatch) {
      console.log('✅ Login would succeed with correct credentials');
    } else {
      console.log('❌ Login would fail even with correct credentials!');
      throw new Error('Login simulation failed');
    }

    const loginWrong = await loginUser.comparePassword('wrong');
    if (!loginWrong) {
      console.log('✅ Login would fail with wrong credentials\n');
    } else {
      console.log('❌ Login would succeed with wrong credentials!\n');
      throw new Error('Password security broken');
    }

    // Test 7: Check comparePassword method exists
    console.log('Test 7: Checking methods...');
    if (typeof user.comparePassword === 'function') {
      console.log('✅ comparePassword method exists\n');
    } else {
      console.log('❌ comparePassword method NOT FOUND!\n');
      throw new Error('comparePassword method missing');
    }

    // Cleanup
    console.log('Cleanup: Removing test user...');
    await User.deleteOne({ email: testUser.email });
    console.log('✅ Test user removed\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('\n✅ Authentication system is working correctly!');
    console.log('✅ Password hashing works');
    console.log('✅ Password comparison works');
    console.log('✅ User creation works');
    console.log('✅ User queries work');
    console.log('\nYou can now test registration and login in your app.\n');
    
  } catch (error) {
    console.log('\n═══════════════════════════════════════');
    console.log('❌ TESTS FAILED!');
    console.log('═══════════════════════════════════════');
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    console.log('\n🔧 Fix the issue above and run this test again.\n');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit();
  }
}

// Run tests
testAuth();