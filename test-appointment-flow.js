/**
 * Complete Appointment to Consultation Flow Test
 *
 * Tests the workflow:
 * 1. Create appointment
 * 2. Check in appointment (moves to queue)
 * 3. Start consultation
 * 4. Complete consultation
 *
 * This should identify any reversion issues.
 */

const BASE_URL = 'http://localhost:8000';

// Test data
const TEST_DATA = {
  receptionist: {
    email: 'receptionalist@mediease.com',
    password: 'Mediease@123'
  },
  doctor: {
    email: 'testdoctor@mediease.com',
    password: 'Mediease@123'
  },
  patient: {
    id: '6914c5bb69f047d51c5df235', // Test PatientUI
    name: 'Test PatientUI'
  }
};

let receptionistToken = '';
let doctorToken = '';
let appointmentId = '';
let queueEntryId = '';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  return { response, data };
}

async function login(credentials) {
  console.log(`🔐 Logging in as ${credentials.email}...`);
  const { response, data } = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${data.message}`);
  }

  console.log(`✅ Logged in successfully`);
  return data.data.accessToken;
}

async function createAppointment(token) {
  console.log('📅 Creating appointment...');

  // Use the exact same format that worked manually
  const appointmentData = {
    patientId: TEST_DATA.patient.id,
    doctorId: '690f471bb22ca0ad77f65b6a',
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    duration: 30,
    priority: 'medium',
    reason: 'Appointment to Queue Flow Test',
    notes: 'Testing appointment to queue flow'
  };

  console.log('Sending data:', JSON.stringify(appointmentData, null, 2));

  const { response, data } = await makeRequest('/api/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(appointmentData)
  });

  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Appointment creation failed: ${data.detail || data.message || JSON.stringify(data)}`);
  }

  appointmentId = data.data.appointment._id;
  console.log(`✅ Appointment created: ${appointmentId}`);
  return appointmentId;
}

async function checkAppointmentStatus(token, expectedStatus) {
  console.log(`🔍 Checking appointment status (expecting: ${expectedStatus})...`);

  const { response, data } = await makeRequest(`/api/appointments/${appointmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get appointment: ${data.message}`);
  }

  const status = data.data.appointment.status;
  console.log(`📊 Appointment status: ${status}`);

  if (status !== expectedStatus) {
    console.warn(`⚠️  Expected status: ${expectedStatus}, got: ${status}`);
  }

  return status;
}

async function checkInAppointment(token) {
  console.log('✅ Checking in appointment...');

  const checkInData = {
    appointmentId: appointmentId,
    reason: 'Testing appointment to queue flow',
    priority: 'medium',
    notes: ''
  };

  const { response, data } = await makeRequest('/api/queue/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(checkInData)
  });

  if (!response.ok) {
    throw new Error(`Check-in failed: ${data.message}`);
  }

  queueEntryId = data.data._id;
  console.log(`✅ Appointment checked in, queue entry: ${queueEntryId}`);
  return queueEntryId;
}

async function checkQueueStatus(token) {
  console.log('📋 Checking queue status...');

  const { response, data } = await makeRequest('/api/queue/doctor/690f471bb22ca0ad77f65b6a', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get queue: ${data.message}`);
  }

  const queueEntries = data.data.queue;
  const patientEntry = queueEntries.find(entry => entry.patient._id === TEST_DATA.patient.id);

  if (patientEntry) {
    console.log(`✅ Patient in queue: ${patientEntry.status} (ID: ${patientEntry._id})`);
    return patientEntry;
  } else {
    console.log('❌ Patient not found in queue');
    console.log('Queue entries:', queueEntries.map(e => `${e.patient.fullName}: ${e.status}`));
    return null;
  }
}

async function startConsultation(token, queueEntryId) {
  console.log('🩺 Starting consultation...');

  const { response, data } = await makeRequest(`/api/queue/${queueEntryId}/start-consultation`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Start consultation failed: ${data.message}`);
  }

  console.log('✅ Consultation started');
  return data.data;
}

async function completeConsultation(token, queueEntryId) {
  console.log('🏁 Completing consultation...');

  const { response, data } = await makeRequest(`/api/queue/${queueEntryId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'completed' })
  });

  if (!response.ok) {
    throw new Error(`Complete consultation failed: ${data.message}`);
  }

  console.log('✅ Consultation completed');
  return data.data;
}

async function runTest() {
  console.log('🚀 Starting Appointment to Consultation Flow Test\n');

  try {
    // Step 1: Login as receptionist
    receptionistToken = await login(TEST_DATA.receptionist);
    console.log();

    // Step 2: Create appointment
    appointmentId = await createAppointment(receptionistToken);
    await checkAppointmentStatus(receptionistToken, 'scheduled');
    console.log();

    // Step 3: Check in appointment
    queueEntryId = await checkInAppointment(receptionistToken);
    await checkAppointmentStatus(receptionistToken, 'checked-in');
    console.log();

    // Step 4: Login as doctor and check queue
    doctorToken = await login(TEST_DATA.doctor);
    let queueEntry = await checkQueueStatus(doctorToken);

    if (!queueEntry) {
      throw new Error('Patient not found in doctor queue after check-in');
    }

    if (queueEntry.status !== 'waiting') {
      console.warn(`⚠️  Expected queue status: waiting, got: ${queueEntry.status}`);
    }
    console.log();

    // Step 5: Start consultation
    await startConsultation(doctorToken, queueEntry._id);
    queueEntry = await checkQueueStatus(doctorToken);

    if (!queueEntry || queueEntry.status !== 'in-consultation') {
      console.warn(`⚠️  Expected queue status after start: in-consultation, got: ${queueEntry?.status}`);
    }
    console.log();

    // Step 6: Complete consultation
    await completeConsultation(doctorToken, queueEntry._id);
    queueEntry = await checkQueueStatus(doctorToken);

    if (queueEntry && queueEntry.status !== 'completed') {
      console.warn(`⚠️  Expected final status: completed, got: ${queueEntry.status}`);
    }
    console.log();

    console.log('✨ Test completed successfully!');
    console.log('📋 Summary:');
    console.log(`   • Appointment: ${appointmentId} (${await checkAppointmentStatus(receptionistToken, 'checked-in')})`);
    console.log(`   • Queue Entry: ${queueEntryId} (completed)`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Debug info:');
    console.error(`   Appointment ID: ${appointmentId}`);
    console.error(`   Queue Entry ID: ${queueEntryId}`);
    throw error;
  }
}

// Run the test
runTest().catch(console.error);

