/**
 * Test script to verify change-password endpoint with proper token
 * Usage: node test-change-password.js
 */

const API_BASE = 'http://192.168.1.8:5000';

async function test() {
  try {
    console.log('=== Testing Change Password Endpoint ===\n');

    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginRes = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'guest1@gmail.com',
        password: 'Guest@123',
      }),
    });
    const loginJson = await loginRes.json();
    console.log('Login response:', loginJson);

    if (!loginRes.ok || !loginJson.token) {
      console.error('❌ Login failed!');
      return;
    }

    const token = loginJson.token;
    console.log('✅ Got token (length:', token.length + ')');
    console.log('Token:', token.substring(0, 50) + '...\n');

    // Step 2: Try to change password WITH token
    console.log('Step 2: Calling change-password WITH Authorization header...');
    const changeRes = await fetch(`${API_BASE}/api/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'Guest@123',
        newPassword: 'NewGuest@456',
      }),
    });

    console.log('Response status:', changeRes.status);
    const changeJson = await changeRes.json();
    console.log('Response body:', JSON.stringify(changeJson, null, 2));

    if (changeRes.ok) {
      console.log('✅ Change password successful!');
    } else {
      console.log('❌ Change password failed with status', changeRes.status);
    }

    // Step 3: Try WITHOUT token (should fail)
    console.log('\n\nStep 3: Calling change-password WITHOUT Authorization header (should fail)...');
    const noTokenRes = await fetch(`${API_BASE}/api/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // NO Authorization header
      },
      body: JSON.stringify({
        currentPassword: 'Guest@123',
        newPassword: 'NewGuest@456',
      }),
    });

    console.log('Response status:', noTokenRes.status);
    const noTokenJson = await noTokenRes.json();
    console.log('Response body:', JSON.stringify(noTokenJson, null, 2));

    if (noTokenRes.status === 401) {
      console.log('✅ Correctly rejected request without token');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
