const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const ClinicalNote = require('../models/ClinicalNote');
const Recording = require('../models/Recording');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await ClinicalNote.deleteMany({});
    await Recording.deleteMany({});
    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@medieaseclinic.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+1-555-0001'
      },
      {
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        email: 'doctor@medieaseclinic.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+1-555-0002',
        speciality: 'Cardiologist',
        licenseNumber: 'MD123456'
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'reception@medieaseclinic.com',
        password: 'Reception@123',
        role: 'receptionist',
        phone: '+1-555-0003'
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }

    console.log('Users seeded successfully');
    return await User.find({});
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

// Seed patients
const seedPatients = async () => {
  try {
    const patients = [
      {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        age: '45',
        bloodGroup: 'A+',
        dateOfBirth: '1978-05-15',
        email: 'john.doe@email.com',
        phone: '+1-555-1001',
        address: '123 Main St, City, State 12345',
        medicalHistory: 'Hypertension, Diabetes Type 2',
        allergies: 'Penicillin',
        familyHistory: 'Father had heart disease',
        currentMedication: 'Metformin, Lisinopril'
      },
      {
        firstName: 'Sarah',
        lastName: 'Wilson',
        gender: 'Female',
        age: '32',
        bloodGroup: 'B+',
        dateOfBirth: '1991-08-22',
        email: 'sarah.wilson@email.com',
        phone: '+1-555-1002',
        address: '456 Oak Ave, City, State 12345',
        medicalHistory: 'Asthma',
        allergies: 'None',
        familyHistory: 'Mother had breast cancer',
        currentMedication: 'Albuterol inhaler'
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        gender: 'Male',
        age: '28',
        bloodGroup: 'O+',
        dateOfBirth: '1995-12-10',
        email: 'michael.brown@email.com',
        phone: '+1-555-1003',
        address: '789 Pine St, City, State 12345',
        medicalHistory: 'None',
        allergies: 'Shellfish',
        familyHistory: 'None',
        currentMedication: 'None'
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        gender: 'Female',
        age: '55',
        bloodGroup: 'AB+',
        dateOfBirth: '1968-03-18',
        email: 'emily.davis@email.com',
        phone: '+1-555-1004',
        address: '321 Elm St, City, State 12345',
        medicalHistory: 'Arthritis, High cholesterol',
        allergies: 'Latex',
        familyHistory: 'Father had stroke',
        currentMedication: 'Atorvastatin, Ibuprofen'
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        gender: 'Male',
        age: '41',
        bloodGroup: 'A-',
        dateOfBirth: '1982-11-05',
        email: 'david.martinez@email.com',
        phone: '+1-555-1005',
        address: '654 Maple Dr, City, State 12345',
        medicalHistory: 'Depression, Anxiety',
        allergies: 'None',
        familyHistory: 'Mother had depression',
        currentMedication: 'Sertraline, Lorazepam'
      }
    ];

    for (const patientData of patients) {
      const patient = new Patient(patientData);
      await patient.save();
    }

    console.log('Patients seeded successfully');
    return await Patient.find({});
  } catch (error) {
    console.error('Error seeding patients:', error);
  }
};

// Seed appointments
const seedAppointments = async (users, patients) => {
  try {
    const doctor = users.find(u => u.role === 'doctor');
    const receptionist = users.find(u => u.role === 'receptionist');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = [
      {
        patient: patients[0]._id,
        doctor: doctor._id,
        scheduledBy: receptionist._id,
        date: today.toISOString().split('T')[0],
        time: '09:00',
        duration: 30,
        status: 'scheduled',
        priority: 'medium',
        reason: 'Annual checkup',
        notes: 'Regular follow-up appointment'
      },
      {
        patient: patients[1]._id,
        doctor: doctor._id,
        scheduledBy: receptionist._id,
        date: today.toISOString().split('T')[0],
        time: '10:30',
        duration: 30,
        status: 'checked-in',
        priority: 'high',
        reason: 'Chest pain evaluation',
        notes: 'Patient reports chest discomfort'
      },
      {
        patient: patients[2]._id,
        doctor: doctor._id,
        scheduledBy: receptionist._id,
        date: tomorrow.toISOString().split('T')[0],
        time: '14:00',
        duration: 30,
        status: 'scheduled',
        priority: 'low',
        reason: 'General consultation',
        notes: 'New patient consultation'
      },
      {
        patient: patients[3]._id,
        doctor: doctor._id,
        scheduledBy: receptionist._id,
        date: tomorrow.toISOString().split('T')[0],
        time: '15:30',
        duration: 45,
        status: 'scheduled',
        priority: 'medium',
        reason: 'Arthritis follow-up',
        notes: 'Review medication effectiveness'
      },
      {
        patient: patients[4]._id,
        doctor: doctor._id,
        scheduledBy: receptionist._id,
        date: today.toISOString().split('T')[0],
        time: '16:00',
        duration: 30,
        status: 'completed',
        priority: 'medium',
        reason: 'Mental health check-in',
        notes: 'Regular therapy session'
      }
    ];

    for (const appointmentData of appointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
    }

    console.log('Appointments seeded successfully');
    return await Appointment.find({});
  } catch (error) {
    console.error('Error seeding appointments:', error);
  }
};

// Seed clinical notes
const seedClinicalNotes = async (users, patients, appointments) => {
  try {
    const doctor = users.find(u => u.role === 'doctor');
    const completedAppointment = appointments.find(a => a.status === 'completed');

    if (completedAppointment) {
      const notes = await ClinicalNote.generateFromConsultation(
        completedAppointment.patient,
        completedAppointment._id,
        doctor._id,
        1800 // 30 minutes in seconds
      );

      for (const noteData of notes) {
        const note = new ClinicalNote(noteData);
        await note.save();
      }
    }

    console.log('Clinical notes seeded successfully');
  } catch (error) {
    console.error('Error seeding clinical notes:', error);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearData();
    
    const users = await seedUsers();
    const patients = await seedPatients();
    const appointments = await seedAppointments(users, patients);
    await seedClinicalNotes(users, patients, appointments);

    console.log('Database seeded successfully!');
    console.log('You can now login with:');
    console.log('Admin: admin@medieaseclinic.com / Admin@123');
    console.log('Doctor: doctor@medieaseclinic.com / Doctor@123');
    console.log('Receptionist: reception@medieaseclinic.com / Reception@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
