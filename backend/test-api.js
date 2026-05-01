const http = require('http');

// Test check-email endpoint
async function testCheckEmail() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/check-email?email=test@gmail.com',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('check-email response:', res.statusCode, data);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('check-email error:', e.message);
      resolve();
    });
    req.end();
  });
}

// Test reset-password endpoint
async function testResetPassword() {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      email: 'test@gmail.com',
      newPassword: 'NewPass123!',
      confirmPassword: 'NewPass123!'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/reset-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('reset-password response:', res.statusCode, data);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('reset-password error:', e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('Testing password reset endpoints...\n');
  await testCheckEmail();
  await testResetPassword();
  console.log('\nDone');
}

runTests();
