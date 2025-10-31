// This script adds a demo patient to the queue for testing the consultation recording feature

import StorageService from '../services/StorageService';

// Force this to run immediately when imported
(async () => {
  console.log('Auto-initializing demo patient...');
  try {
    const result = await addDemoPatient();
    console.log('Auto-init result:', result.success ? 'Success' : 'Failed');
  } catch (err) {
    console.error('Auto-init error:', err);
  }
})();

const addDemoPatient = async () => {
  try {
    // Get existing patients
    const patients = await StorageService.getPatients();
    
    // Create a demo patient
    const demoPatient = {
      id: 'demo123',
      patientId: 'P999',
      firstName: 'Demo',
      lastName: 'Patient',
      gender: 'Male',
      age: '42',
      bloodGroup: 'O+',
      dateOfBirth: '01/01/1982',
      email: 'demo.patient@example.com',
      phone: '555-DEMO',
      address: '123 Test Street, Demo City',
      vitals: {
        bloodPressure: '120/80',
        heartRate: '72',
        temperature: '98.6°F',
        oxygenSaturation: '98%',
        weight: '70kg',
        height: '175cm',
        bmi: '22.9'
      },
      medicalHistory: 'Asthma, Seasonal Allergies',
      allergies: 'Pollen, Dust',
      familyHistory: 'Father: Hypertension, Mother: Diabetes',
      previousSurgeries: 'None',
      currentMedication: 'Albuterol inhaler as needed',
      lifestyle: {
        smoking: 'Never',
        alcohol: 'Social',
        exercise: 'Regular',
        diet: 'Balanced',
        sleep: '7-8 hours',
        stress: 'Moderate'
      },
      chiefComplaint: 'Persistent cough and mild fever',
      currentSymptoms: 'Coughing, slight fever, fatigue for the past 3 days',
      painLevel: '3',
      durationOfSymptoms: '3 days',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Queue-specific properties
      waitTime: '5 min',
      status: 'waiting',
      reason: 'Persistent cough and mild fever',
      presentInClinic: true
    };
    
    // Check if demo patient already exists
    const existingDemoIndex = patients.findIndex(p => p.id === demoPatient.id);
    
    if (existingDemoIndex >= 0) {
      // Update existing demo patient
      patients[existingDemoIndex] = demoPatient;
      console.log('Demo patient updated');
    } else {
      // Add new demo patient
      patients.push(demoPatient);
      console.log('Demo patient added');
    }
    
    // Save updated patients list
    await StorageService.savePatients(patients);
    
    // Create an appointment for the demo patient
    const appointments = await StorageService.getAppointments();
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    const demoAppointment = {
      id: 'aptDemo',
      patientId: demoPatient.id,
      patientFirstName: demoPatient.firstName,
      patientLastName: demoPatient.lastName,
      patientPhone: demoPatient.phone,
      doctorId: 'doctor-demo-1', // ID of Dr. Jane Smith (doctor@gmail.com)
      date: today, // Today's date
      time: '10:00',
      duration: 30,
      status: 'confirmed', // Make sure this is a status that shows in queue
      reason: 'Persistent cough and mild fever',
      notes: 'Demo patient for testing consultation recording',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      presentInClinic: true
    };
    
    // Check if demo appointment already exists
    const existingAppointmentIndex = appointments.findIndex(a => a.id === demoAppointment.id);
    
    if (existingAppointmentIndex >= 0) {
      // Update existing appointment
      appointments[existingAppointmentIndex] = demoAppointment;
      console.log('Demo appointment updated');
    } else {
      // Add new appointment
      appointments.push(demoAppointment);
      console.log('Demo appointment added');
    }
    
    // Save updated appointments list
    await StorageService.saveAppointments(appointments);
    
    return { success: true, patient: demoPatient };
  } catch (error) {
    console.error('Error adding demo patient:', error);
    return { success: false, error };
  }
};

export default addDemoPatient;
