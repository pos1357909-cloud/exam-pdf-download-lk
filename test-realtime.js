/**
 * Real-time Socket.IO Test Script
 * Tests: student:registered, student:updated, approval:new, approval:updated
 */

const { io } = require('socket.io-client');

const SERVER = 'http://localhost:3000';

console.log('\n🧪 Real-time Socket.IO Test Starting...\n');

// ─── CLIENT 1: Admin PC ─────────────────────────────────────────────────────
const adminClient = io(SERVER);

adminClient.on('connect', () => {
  console.log('🖥️  [ADMIN PC] Connected — socket id:', adminClient.id);
});

adminClient.on('student:registered', (data) => {
  console.log('🖥️  [ADMIN PC] ✅ NEW STUDENT registered — real-time received!');
  console.log('   Name:', data.name, '| Email:', data.email, '| Plan:', data.plan);
});

adminClient.on('approval:new', (data) => {
  console.log('🖥️  [ADMIN PC] 💳 NEW PAYMENT CLAIM — real-time received!');
  console.log('   Student:', data.studentName, '| Plan:', data.plan, '| Coins:', data.coins);
});

// ─── CLIENT 2: Student Phone ─────────────────────────────────────────────────
const studentClient = io(SERVER);

studentClient.on('connect', () => {
  console.log('📱 [STUDENT PHONE] Connected — socket id:', studentClient.id);
  console.log('');
  console.log('⏳ Waiting 1 second before tests...\n');

  setTimeout(runTests, 1000);
});

studentClient.on('student:updated', (data) => {
  console.log('📱 [STUDENT PHONE] ✅ COINS/PLAN UPDATED — real-time received!');
  console.log('   Email:', data.email, '| Coins:', data.coins, '| Plan:', data.plan);
});

studentClient.on('approval:updated', (data) => {
  console.log('📱 [STUDENT PHONE] 🎉 APPROVAL STATUS — real-time received!');
  console.log('   Status:', data.status, '| Plan:', data.plan, '| Coins added:', data.coinsAdded);
});


// ─── SIMULATE SERVER EVENTS VIA API ─────────────────────────────────────────

async function runTests() {
  const http = require('http');

  function apiPost(path, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: 'localhost', port: 3000,
        path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      }, (res) => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  function apiPut(path, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request({
        hostname: 'localhost', port: 3000,
        path, method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
      }, (res) => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // ── TEST 1: Student Registers ──────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Student registers from phone...');
  const testEmail = `testuser_${Date.now()}@test.com`;
  const r1 = await apiPost('/api/students/register', {
    name: 'Test Student',
    email: testEmail,
    password: 'pass123',
    studentId: 'STD-TEST-' + Date.now()
  });
  console.log('   API Response:', r1.status === 201 ? '201 Created ✅' : `${r1.status} ❌`);
  await sleep(500);

  // ── TEST 2: Admin updates student coins ─────────────────────────────────────
  console.log('\nTEST 2: Admin updates student coins from PC...');
  const r2 = await apiPut('/api/students/' + testEmail, {
    coins: 500,
    plan: 'Gold',
    todayUsedCoins: 0
  });
  console.log('   API Response:', r2.status === 200 ? '200 OK ✅' : `${r2.status} ❌`);
  await sleep(500);

  // ── TEST 3: Student submits payment claim ──────────────────────────────────
  console.log('\nTEST 3: Student submits payment claim from phone...');
  const reqId = 'REQ-TEST-' + Date.now();
  const r3 = await apiPost('/api/approvals', {
    requestId: reqId,
    studentEmail: testEmail,
    studentName: 'Test Student',
    paymentId: 'PAY-12345',
    plan: 'Silver',
    coins: 750,
    status: 'pending',
    date: new Date().toLocaleString()
  });
  console.log('   API Response:', r3.status === 201 ? '201 Created ✅' : `${r3.status} ❌`);
  await sleep(500);

  // ── TEST 4: Admin approves payment ─────────────────────────────────────────
  console.log('\nTEST 4: Admin approves payment from PC...');
  const r4 = await apiPut('/api/approvals/' + reqId, { status: 'approved' });
  console.log('   API Response:', r4.status === 200 ? '200 OK ✅' : `${r4.status} ❌`);
  await sleep(500);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests done. Closing connections...\n');

  adminClient.disconnect();
  studentClient.disconnect();
  process.exit(0);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
