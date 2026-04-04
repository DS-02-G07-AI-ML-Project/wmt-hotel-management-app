const dotenv = require('dotenv');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projectRoot = path.resolve(__dirname, '..');
const runId = `smoke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const smokeDbName = `hotel_management_smoke_${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildSmokeMongoUri(uri, dbName) {
  const match = String(uri).match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/);
  if (!match) {
    throw new Error('Invalid MONGO_URI format.');
  }

  const prefix = match[1];
  const query = match[3] || '';
  return `${prefix}/${dbName}${query}`;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    }, 3000);
  });
}

async function requestJson(baseUrl, endpoint, { method = 'GET', token, body, expectedStatus } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch (error) {
    json = null;
  }

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    throw new Error(
      `${method} ${endpoint} expected ${expectedStatus}, got ${response.status}. Body: ${raw || '<empty>'}`
    );
  }

  return { status: response.status, json, raw };
}

async function waitForServer(baseUrl, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await requestJson(baseUrl, '/', { expectedStatus: 200 });
      assert(
        typeof res.raw === 'string' && res.raw.includes('Hotel Management API is running'),
        'Unexpected health response body.'
      );
      return;
    } catch (error) {
      await sleep(300);
    }
  }

  throw new Error('Timed out waiting for backend server to become healthy.');
}

async function withStep(results, name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    throw new Error(`[${name}] ${error.message}`);
  }
}

async function runCrudSuite(baseUrl) {
  const results = [];

  const adminEmail = `${runId}@example.com`;
  const adminPassword = 'SmokePass123!';
  let adminToken;

  let roomId;
  let bookingId;

  await withStep(results, 'auth.register_admin', async () => {
    const res = await requestJson(baseUrl, '/api/users/register', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        name: 'Smoke Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      },
    });

    assert(res.json && res.json.success === true, 'Register response not successful.');
    assert(typeof res.json.token === 'string' && res.json.token.length > 20, 'Missing auth token on register.');
    adminToken = res.json.token;
  });

  await withStep(results, 'rooms.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/rooms', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        roomNumber: `R-${Date.now()}`,
        type: 'Single',
        capacity: 2,
        pricePerNight: 90,
        status: 'Available',
        features: ['WiFi'],
        description: 'Smoke test room',
      },
    });

    roomId = createRes.json?.data?._id;
    assert(roomId, 'Room create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/rooms', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Room list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === roomId), 'Created room missing from list.');

    await requestJson(baseUrl, `/api/rooms/${roomId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/rooms/${roomId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Occupied', capacity: 3 },
    });
    assert(updateRes.json?.data?.status === 'Occupied', 'Room update did not persist status.');
    assert(updateRes.json?.data?.capacity === 3, 'Room update did not persist capacity.');
  });

  await withStep(results, 'bookings.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/bookings', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        guestName: 'Smoke Guest',
        guestEmail: 'guest@example.com',
        room: roomId,
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
        totalAmount: 120,
      },
    });

    bookingId = createRes.json?.data?._id;
    assert(bookingId, 'Booking create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/bookings', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Booking list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === bookingId), 'Created booking missing from list.');

    await requestJson(baseUrl, `/api/bookings/${bookingId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/bookings/${bookingId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'confirmed', notes: 'Updated by smoke test' },
    });

    assert(updateRes.json?.data?.status === 'confirmed', 'Booking update did not persist status.');
  });

  await withStep(results, 'staff.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/staff', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        name: 'Smoke Staff',
        email: `staff-${runId}@example.com`,
        position: 'Receptionist',
        department: 'Front Office',
      },
    });

    const staffId = createRes.json?.data?._id;
    assert(staffId, 'Staff create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/staff', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Staff list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === staffId), 'Created staff missing from list.');

    await requestJson(baseUrl, `/api/staff/${staffId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/staff/${staffId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'On Leave' },
    });
    assert(updateRes.json?.data?.status === 'On Leave', 'Staff update did not persist status.');

    await requestJson(baseUrl, `/api/staff/${staffId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/staff/${staffId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'payments.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/payments', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        amount: 120,
        method: 'Cash',
        status: 'Pending',
        booking: bookingId,
      },
    });

    const paymentId = createRes.json?.data?._id;
    assert(paymentId, 'Payment create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/payments', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Payment list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === paymentId), 'Created payment missing from list.');

    await requestJson(baseUrl, `/api/payments/${paymentId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/payments/${paymentId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Completed', reference: runId },
    });

    assert(updateRes.json?.data?.status === 'Completed', 'Payment update did not persist status.');

    await requestJson(baseUrl, `/api/payments/${paymentId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/payments/${paymentId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'complaints.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/complaints', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        title: 'AC issue',
        description: 'Room AC not cooling well',
        category: 'Maintenance',
        priority: 'High',
        room: roomId,
      },
    });

    const complaintId = createRes.json?.data?._id;
    assert(complaintId, 'Complaint create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/complaints', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Complaint list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === complaintId), 'Created complaint missing from list.');

    await requestJson(baseUrl, `/api/complaints/${complaintId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/complaints/${complaintId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Resolved' },
    });

    assert(updateRes.json?.data?.status === 'Resolved', 'Complaint update did not persist status.');

    await requestJson(baseUrl, `/api/complaints/${complaintId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/complaints/${complaintId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'visitors.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/visitors', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        fullName: 'Smoke Visitor',
        idNumber: `NIC-${Date.now()}`,
        purpose: 'Meeting',
        hostName: 'Smoke Admin',
      },
    });

    const visitorId = createRes.json?.data?._id;
    assert(visitorId, 'Visitor create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/visitors', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Visitor list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === visitorId), 'Created visitor missing from list.');

    await requestJson(baseUrl, `/api/visitors/${visitorId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/visitors/${visitorId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Checked Out' },
    });

    assert(updateRes.json?.data?.status === 'Checked Out', 'Visitor update did not persist status.');

    await requestJson(baseUrl, `/api/visitors/${visitorId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/visitors/${visitorId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'bookings.delete', async () => {
    await requestJson(baseUrl, `/api/bookings/${bookingId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/bookings/${bookingId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'rooms.delete', async () => {
    await requestJson(baseUrl, `/api/rooms/${roomId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/rooms/${roomId}`, { expectedStatus: 404 });
  });

  return results;
}

async function cleanupDatabase(uri) {
  await mongoose.connect(uri);
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}

async function main() {
  assert(process.env.MONGO_URI, 'MONGO_URI is required in backend/.env for CRUD integration test.');
  assert(process.env.JWT_SECRET, 'JWT_SECRET is required in backend/.env for CRUD integration test.');

  const smokeMongoUri = buildSmokeMongoUri(process.env.MONGO_URI, smokeDbName);
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      MONGO_URI: smokeMongoUri,
      PUBLIC_API_URL: baseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  let results = [];

  try {
    await waitForServer(baseUrl);
    results = await runCrudSuite(baseUrl);
  } catch (error) {
    throw new Error(`${error.message}\n\nServer logs:\n${logs}`);
  } finally {
    await stopChild(child);
    await cleanupDatabase(smokeMongoUri).catch(() => null);
  }

  console.log('CRUD integration test passed for all 6 core modules.');
  for (const result of results) {
    console.log(`- ${result.name}: PASS`);
  }
}

main().catch((error) => {
  console.error('CRUD integration test failed.');
  console.error(error.message);
  process.exit(1);
});
