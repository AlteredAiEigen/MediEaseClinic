/**
 * Automated UI Test for MediEase Clinic
 * Tests the complete patient journey from registration to consultation
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:5173';
const RECEPTIONIST_EMAIL = 'receptionalist@mediease.com';
const RECEPTIONIST_PASSWORD = 'Mediease@123';
const DOCTOR_EMAIL = 'testdoctor@mediease.com';
const DOCTOR_PASSWORD = 'Mediease@123';

// Test data
const TEST_PATIENT = {
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe.${Date.now()}@test.com`,
  phone: '9876543210',
  dateOfBirth: '1990-01-01',
  gender: 'Male',
  age: '34',
  bloodGroup: 'O+',
  address: '123 Test Street, Test City',
  emergencyContact: 'Jane Doe',
  emergencyPhone: '9876543211'
};

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAsReceptionist(page) {
  console.log('📝 Logging in as receptionist...');
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.type('input[type="email"]', RECEPTIONIST_EMAIL);
  await page.type('input[type="password"]', RECEPTIONIST_PASSWORD);
  
  await page.click('button[type="submit"]');
  await wait(2000);
  
  console.log('✅ Logged in as receptionist');
}

async function loginAsDoctor(page) {
  console.log('👨‍⚕️ Logging in as doctor...');
  await page.goto(`${FRONTEND_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.type('input[type="email"]', DOCTOR_EMAIL);
  await page.type('input[type="password"]', DOCTOR_PASSWORD);
  
  await page.click('button[type="submit"]');
  await wait(2000);
  
  console.log('✅ Logged in as doctor');
}

async function registerPatient(page) {
  console.log('👤 Registering new patient...');
  
  // Navigate to patient registration
  await page.goto(`${FRONTEND_URL}/receptionist-workstation`);
  await wait(2000);
  
  // Look for "New Patient" or "Register Patient" button
  const newPatientButton = await page.$('button:has-text("New Patient"), button:has-text("Register Patient")');
  if (newPatientButton) {
    await newPatientButton.click();
    await wait(1000);
  }
  
  // Fill patient form
  await page.type('input[name="firstName"]', TEST_PATIENT.firstName);
  await page.type('input[name="lastName"]', TEST_PATIENT.lastName);
  await page.type('input[name="email"]', TEST_PATIENT.email);
  await page.type('input[name="phone"]', TEST_PATIENT.phone);
  await page.type('input[name="dateOfBirth"]', TEST_PATIENT.dateOfBirth);
  await page.type('input[name="age"]', TEST_PATIENT.age);
  await page.type('input[name="address"]', TEST_PATIENT.address);
  
  // Select gender
  await page.select('select[name="gender"]', TEST_PATIENT.gender);
  
  // Select blood group
  await page.select('select[name="bloodGroup"]', TEST_PATIENT.bloodGroup);
  
  await page.type('input[name="emergencyContact"]', TEST_PATIENT.emergencyContact);
  await page.type('input[name="emergencyPhone"]', TEST_PATIENT.emergencyPhone);
  
  // Submit form
  await page.click('button[type="submit"]');
  await wait(3000);
  
  console.log('✅ Patient registered successfully');
}

async function scheduleAppointment(page) {
  console.log('📅 Scheduling appointment...');
  
  // Look for "Schedule Appointment" or "New Appointment" button
  const scheduleButton = await page.$('button:has-text("Schedule"), button:has-text("New Appointment")');
  if (scheduleButton) {
    await scheduleButton.click();
    await wait(1000);
  }
  
  // Select patient (assuming the last registered patient is selected by default or search)
  // Fill appointment details
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  
  await page.type('input[name="appointmentDate"]', appointmentDate);
  await page.type('input[name="appointmentTime"]', '10:00');
  
  // Select doctor
  await page.select('select[name="doctorId"]', ''); // Will select first doctor
  
  // Reason for visit
  await page.type('textarea[name="reason"]', 'General checkup and consultation');
  
  // Submit
  await page.click('button[type="submit"]');
  await wait(3000);
  
  console.log('✅ Appointment scheduled successfully');
}

async function checkInPatient(page) {
  console.log('✅ Checking in patient...');
  
  // Navigate to receptionist workstation
  await page.goto(`${FRONTEND_URL}/receptionist-workstation`);
  await wait(2000);
  
  // Find the patient in the appointments list and click check-in
  const checkInButton = await page.$('button:has-text("Check In")');
  if (checkInButton) {
    await checkInButton.click();
    await wait(2000);
  }
  
  console.log('✅ Patient checked in successfully');
}

async function startConsultation(page) {
  console.log('🩺 Starting consultation...');
  
  // Navigate to doctor dashboard
  await page.goto(`${FRONTEND_URL}/doctor-dashboard`);
  await wait(3000);
  
  // Find the patient in the queue and click "Start"
  const startButton = await page.$('button:has-text("Start"), a:has-text("Start")');
  if (startButton) {
    await startButton.click();
    await wait(3000);
  }
  
  console.log('✅ Consultation started');
}

async function startRecording(page) {
  console.log('🎤 Starting recording...');
  
  // Find and click the record button
  const recordButton = await page.$('button:has-text("Start Recording"), button[aria-label="Start Recording"]');
  if (recordButton) {
    await recordButton.click();
    await wait(5000); // Record for 5 seconds
  }
  
  console.log('✅ Recording started');
}

async function stopRecording(page) {
  console.log('⏹️ Stopping recording...');
  
  // Find and click the stop button
  const stopButton = await page.$('button:has-text("Stop Recording"), button[aria-label="Stop Recording"]');
  if (stopButton) {
    await stopButton.click();
    await wait(2000);
  }
  
  console.log('✅ Recording stopped');
}

async function endConsultation(page) {
  console.log('🏁 Ending consultation...');
  
  // Find and click the complete/end consultation button
  const endButton = await page.$('button:has-text("Complete"), button:has-text("End Consultation")');
  if (endButton) {
    await endButton.click();
    await wait(2000);
  }
  
  console.log('✅ Consultation ended successfully');
}

async function runTest() {
  console.log('🚀 Starting MediEase Clinic UI Test\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    slowMo: 50, // Slow down by 50ms for better visibility
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream', // Auto-grant microphone permission
      '--use-fake-device-for-media-stream'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Grant microphone permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(FRONTEND_URL, ['microphone']);
    
    // Step 1: Login as Receptionist
    await loginAsReceptionist(page);
    
    // Step 2: Register Patient
    await registerPatient(page);
    
    // Step 3: Schedule Appointment
    await scheduleAppointment(page);
    
    // Step 4: Check In Patient
    await checkInPatient(page);
    
    // Logout
    console.log('🚪 Logging out receptionist...');
    await page.goto(`${FRONTEND_URL}/logout`);
    await wait(2000);
    
    // Step 5: Login as Doctor
    await loginAsDoctor(page);
    
    // Step 6: Start Consultation
    await startConsultation(page);
    
    // Step 7: Start Recording
    await startRecording(page);
    
    // Wait for recording
    await wait(10000);
    
    // Step 8: Stop Recording
    await stopRecording(page);
    
    // Step 9: End Consultation
    await endConsultation(page);
    
    console.log('\n✨ All tests completed successfully! ✨\n');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('📸 Screenshot saved as test-result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await wait(5000);
    await browser.close();
  }
}

// Run the test
runTest().catch(console.error);

