import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { usePatients } from '../context/PatientsContext';
import { Patient, PatientFormData } from '../models/Patient';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernIcon from '../components/ModernIcon';
import ModernHeader from '../components/ModernHeader';
import ModernInput from '../components/ModernInput';
import HamburgerMenu from '../components/HamburgerMenu';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  PatientInformationForm: { patientId?: string };
  Recording: { patient: any };
};

type PatientInformationFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PatientInformationForm'
>;

interface Props {
  navigation: PatientInformationFormScreenNavigationProp;
  route: { params: { patientId?: string } };
}

const PatientInformationFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { createPatient, updatePatient, getPatientById, loading } = usePatients();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('patientDetails');
  const [showTimeline, setShowTimeline] = useState(false);
  const { patientId } = route.params || {};
  const isEditMode = !!patientId;
  const [saving, setSaving] = useState(false);

  // Form state following the handwritten form structure
  const [formData, setFormData] = useState({
    // Search Section
    patientId: '',
    
    // Patient Info Section
    firstName: '',
    lastName: '',
    gender: '',
    age: '',
    
    // Contact Details Section
    bloodGroup: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    
    // Reports Section - Vitals
    vitals: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      bmi: '',
    },
    
    // Impairments Section - Chief Complaint/Issues
    chiefComplaint: '',
    currentSymptoms: '',
    painLevel: '',
    durationOfSymptoms: '',
    
    // Insurance Section - Medical History
    medicalHistory: '',
    allergies: '',
    familyHistory: '',
    previousSurgeries: '',
    
    // Admission Information Section - Current Medication
    currentMedication: '',
    medicationDosage: '',
    medicationFrequency: '',
    lastMedicationReview: '',
    
    // Treatment/Termination & Information Section - Lifestyle & Habits
    lifestyle: {
      smoking: '',
      alcohol: '',
      exercise: '',
      diet: '',
      sleep: '',
      stress: '',
    },
    
    // Care Plans Section
    carePlan: '',
    treatmentGoals: '',
    followUpSchedule: '',
    
    // Doctor Notes Section
    doctorNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    recommendations: '',
    
    // Portal Info
    userName: '',
    portalPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVitalsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [field]: value,
      }
    }));
  };

  const handleLifestyleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        [field]: value,
      }
    }));
  };

  // Load patient data if in edit mode
  useEffect(() => {
    if (isEditMode && patientId) {
      const patient = getPatientById(patientId);
      if (patient) {
        setFormData({
          patientId: patient.patientId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          gender: patient.gender,
          age: patient.age,
          bloodGroup: patient.bloodGroup,
          dateOfBirth: patient.dateOfBirth,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          vitals: patient.vitals,
          medicalHistory: patient.medicalHistory,
          allergies: patient.allergies,
          familyHistory: patient.familyHistory,
          previousSurgeries: patient.previousSurgeries,
          currentMedication: patient.currentMedication,
          lifestyle: patient.lifestyle,
          carePlan: patient.carePlan || '',
          treatmentGoals: patient.treatmentGoals || '',
          followUpSchedule: patient.followUpSchedule || '',
          doctorNotes: patient.doctorNotes || '',
          diagnosis: patient.diagnosis || '',
          treatmentPlan: patient.treatmentPlan || '',
          recommendations: patient.recommendations || '',
          userName: patient.userName || '',
          portalPassword: patient.portalPassword || '',
        });
      }
    }
  }, [isEditMode, patientId, getPatientById]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        Alert.alert('Validation Error', 'Please fill in all required fields (First Name, Last Name, Email, Phone)');
        return;
      }

      const patientData: PatientFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        age: formData.age,
        bloodGroup: formData.bloodGroup,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        medicalHistory: formData.medicalHistory,
        allergies: formData.allergies,
        familyHistory: formData.familyHistory,
        previousSurgeries: formData.previousSurgeries,
        currentMedication: formData.currentMedication,
        lifestyle: formData.lifestyle,
      };

      if (isEditMode && patientId) {
        await updatePatient(patientId, patientData);
        Alert.alert('Success', 'Patient information updated successfully!');
      } else {
        await createPatient(patientData);
        Alert.alert('Success', 'New patient registered successfully!');
      }
      
      navigation.navigate('PatientSelection');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save patient information');
    } finally {
      setSaving(false);
    }
  };

  const renderSearch = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Search Patient
      </Text>
      
      <ModernInput
        label="Patient ID"
        value={formData.patientId}
        onChangeText={(value) => handleInputChange('patientId', value)}
        placeholder="Enter patient ID to search"
        leftIcon={<ModernIcon name="search" size={20} color={theme.colors.foregroundMuted} />}
      />
    </ModernCard>
  );

  const renderPatientDetails = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Patient Information
      </Text>
      
      <View style={styles.row}>
        <ModernInput
          label="First Name"
          value={formData.firstName}
          onChangeText={(value) => handleInputChange('firstName', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="user" size={20} color={theme.colors.foregroundMuted} />}
        />
        
        <ModernInput
          label="Last Name"
          value={formData.lastName}
          onChangeText={(value) => handleInputChange('lastName', value)}
          containerStyle={styles.halfInput}
        />
      </View>
      
      <View style={styles.row}>
        <ModernInput
          label="Gender"
          value={formData.gender}
          onChangeText={(value) => handleInputChange('gender', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="users" size={20} color={theme.colors.foregroundMuted} />}
        />
        
        <ModernInput
          label="Age"
          value={formData.age}
          onChangeText={(value) => handleInputChange('age', value)}
          containerStyle={styles.halfInput}
          keyboardType="numeric"
        />
      </View>
    </ModernCard>
  );

  const renderContactInfo = () => (
    <ModernCard style={[styles.sectionCard, styles.compactCard]}>
      <View style={styles.sectionHeader}>
        <ModernIcon name="user" size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Contact Details
        </Text>
      </View>
      
      <View style={styles.twoColumnGrid}>
        <ModernInput
          label="Blood Group"
          value={formData.bloodGroup}
          onChangeText={(value) => handleInputChange('bloodGroup', value)}
          containerStyle={styles.gridItem}
          leftIcon={<ModernIcon name="droplet" size={20} color={theme.colors.medicalError} />}
          placeholder="A+, B-, O+, etc."
        />
        
        <ModernInput
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChangeText={(value) => handleInputChange('dateOfBirth', value)}
          containerStyle={styles.gridItem}
          leftIcon={<ModernIcon name="calendar" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="DD/MM/YYYY"
        />
      </View>
      
      <View style={styles.twoColumnGrid}>
        <ModernInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          containerStyle={styles.gridItem}
          leftIcon={<ModernIcon name="mail" size={20} color={theme.colors.foregroundMuted} />}
          keyboardType="email-address"
        />
        
        <ModernInput
          label="Phone"
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          containerStyle={styles.gridItem}
          leftIcon={<ModernIcon name="phone" size={20} color={theme.colors.foregroundMuted} />}
          keyboardType="phone-pad"
        />
      </View>
      
      <ModernInput
        label="Address"
        value={formData.address}
        onChangeText={(value) => handleInputChange('address', value)}
        leftIcon={<ModernIcon name="map-pin" size={20} color={theme.colors.foregroundMuted} />}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />
    </ModernCard>
  );
  
  const renderPatientPortal = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        MediEase Patient Portal
      </Text>
      
      <View style={styles.portalSection}>
        <Text style={styles.portalSectionHeader}>Personal</Text>
        
        <ModernInput
          label="Username"
          value={formData.userName}
          onChangeText={(value) => handleInputChange('userName', value)}
          leftIcon={<ModernIcon name="user" size={20} color={theme.colors.primary} />}
        />
        
        <View style={styles.portalButtonContainer}>
          <ModernButton
            title="Sign In"
            onPress={() => {
              // Handle portal sign in
              Alert.alert('Portal Sign In', 'Signing in to patient portal...');
            }}
            variant="primary"
            style={styles.portalButton}
          />
        </View>
      </View>
    </ModernCard>
  );

  const renderVitals = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Reports - Vitals
      </Text>
      
      <View style={styles.row}>
        <ModernInput
          label="Blood Pressure"
          value={formData.vitals.bloodPressure}
          onChangeText={(value) => handleVitalsChange('bloodPressure', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="activity" size={20} color={theme.colors.medicalError} />}
          placeholder="120/80 mmHg"
        />
        
        <ModernInput
          label="Heart Rate"
          value={formData.vitals.heartRate}
          onChangeText={(value) => handleVitalsChange('heartRate', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="heart" size={20} color={theme.colors.medicalError} />}
          placeholder="72 bpm"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.row}>
        <ModernInput
          label="Temperature"
          value={formData.vitals.temperature}
          onChangeText={(value) => handleVitalsChange('temperature', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="thermometer" size={20} color={theme.colors.medicalWarning} />}
          placeholder="98.6 °F"
          keyboardType="numeric"
        />
        
        <ModernInput
          label="Oxygen Saturation"
          value={formData.vitals.oxygenSaturation}
          onChangeText={(value) => handleVitalsChange('oxygenSaturation', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="percent" size={20} color={theme.colors.medicalSuccess} />}
          placeholder="98%"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.row}>
        <ModernInput
          label="Weight"
          value={formData.vitals.weight}
          onChangeText={(value) => handleVitalsChange('weight', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="weight" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="70 kg"
          keyboardType="numeric"
        />
        
        <ModernInput
          label="Height"
          value={formData.vitals.height}
          onChangeText={(value) => handleVitalsChange('height', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="ruler" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="170 cm"
          keyboardType="numeric"
        />
      </View>
      
      <ModernInput
        label="BMI"
        value={formData.vitals.bmi}
        onChangeText={(value) => handleVitalsChange('bmi', value)}
        leftIcon={<ModernIcon name="calculator" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="24.2"
        keyboardType="numeric"
      />
    </ModernCard>
  );

  const renderChiefComplaint = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Impairments - Chief Complaint / Issues
      </Text>
      
      <ModernInput
        label="Chief Complaint"
        value={formData.chiefComplaint}
        onChangeText={(value) => handleInputChange('chiefComplaint', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="alert-circle" size={20} color={theme.colors.medicalWarning} />}
        placeholder="Primary reason for visit"
      />
      
      <ModernInput
        label="Current Symptoms"
        value={formData.currentSymptoms}
        onChangeText={(value) => handleInputChange('currentSymptoms', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="list" size={20} color={theme.colors.medicalWarning} />}
        placeholder="Describe current symptoms"
      />
      
      <View style={styles.row}>
        <ModernInput
          label="Pain Level (1-10)"
          value={formData.painLevel}
          onChangeText={(value) => handleInputChange('painLevel', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="zap" size={20} color={theme.colors.medicalError} />}
          placeholder="1-10"
          keyboardType="numeric"
        />
        
        <ModernInput
          label="Duration of Symptoms"
          value={formData.durationOfSymptoms}
          onChangeText={(value) => handleInputChange('durationOfSymptoms', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="clock" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="e.g., 2 days, 1 week"
        />
      </View>
    </ModernCard>
  );

  const renderMedicalHistory = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Insurance - Medical History
      </Text>
      
      <ModernInput
        label="Medical History"
        value={formData.medicalHistory}
        onChangeText={(value) => handleInputChange('medicalHistory', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="file-text" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="Previous medical conditions, chronic illnesses"
      />
      
      <ModernInput
        label="Allergies"
        value={formData.allergies}
        onChangeText={(value) => handleInputChange('allergies', value)}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="alert-triangle" size={20} color={theme.colors.medicalError} />}
        placeholder="Drug allergies, food allergies, environmental allergies"
      />
      
      <ModernInput
        label="Family History"
        value={formData.familyHistory}
        onChangeText={(value) => handleInputChange('familyHistory', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="users" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="Family medical history, hereditary conditions"
      />
      
      <ModernInput
        label="Previous Surgeries"
        value={formData.previousSurgeries}
        onChangeText={(value) => handleInputChange('previousSurgeries', value)}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="scissors" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="Previous surgical procedures, dates"
      />
    </ModernCard>
  );

  const renderCurrentMedication = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Admission Information - Current Medication
      </Text>
      
      <ModernInput
        label="Current Medication"
        value={formData.currentMedication}
        onChangeText={(value) => handleInputChange('currentMedication', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="package" size={20} color={theme.colors.medicalInfo} />}
        placeholder="List all current medications"
      />
      
      <View style={styles.row}>
        <ModernInput
          label="Dosage"
          value={formData.medicationDosage}
          onChangeText={(value) => handleInputChange('medicationDosage', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="hash" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="e.g., 10mg, 2 tablets"
        />
        
        <ModernInput
          label="Frequency"
          value={formData.medicationFrequency}
          onChangeText={(value) => handleInputChange('medicationFrequency', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="clock" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="e.g., Twice daily, As needed"
        />
      </View>
      
      <ModernInput
        label="Last Medication Review"
        value={formData.lastMedicationReview}
        onChangeText={(value) => handleInputChange('lastMedicationReview', value)}
        leftIcon={<ModernIcon name="calendar" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="Date of last medication review"
      />
    </ModernCard>
  );

  const renderLifestyle = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Treatment/Termination & Information - Lifestyle & Habits
      </Text>
      
      <View style={styles.row}>
        <ModernInput
          label="Smoking"
          value={formData.lifestyle.smoking}
          onChangeText={(value) => handleLifestyleChange('smoking', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="x" size={20} color={theme.colors.medicalError} />}
          placeholder="Never, Former, Current"
        />
        
        <ModernInput
          label="Alcohol"
          value={formData.lifestyle.alcohol}
          onChangeText={(value) => handleLifestyleChange('alcohol', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="droplet" size={20} color={theme.colors.medicalWarning} />}
          placeholder="None, Occasional, Regular"
        />
      </View>
      
      <View style={styles.row}>
        <ModernInput
          label="Exercise"
          value={formData.lifestyle.exercise}
          onChangeText={(value) => handleLifestyleChange('exercise', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="activity" size={20} color={theme.colors.medicalSuccess} />}
          placeholder="None, Light, Moderate, Intense"
        />
        
        <ModernInput
          label="Diet"
          value={formData.lifestyle.diet}
          onChangeText={(value) => handleLifestyleChange('diet', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="apple" size={20} color={theme.colors.medicalSuccess} />}
          placeholder="Regular, Vegetarian, Vegan, etc."
        />
      </View>
      
      <View style={styles.row}>
        <ModernInput
          label="Sleep"
          value={formData.lifestyle.sleep}
          onChangeText={(value) => handleLifestyleChange('sleep', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="moon" size={20} color={theme.colors.foregroundMuted} />}
          placeholder="Hours per night, quality"
        />
        
        <ModernInput
          label="Stress Level"
          value={formData.lifestyle.stress}
          onChangeText={(value) => handleLifestyleChange('stress', value)}
          containerStyle={styles.halfInput}
          leftIcon={<ModernIcon name="zap" size={20} color={theme.colors.medicalWarning} />}
          placeholder="Low, Moderate, High"
        />
      </View>
    </ModernCard>
  );

  const renderCarePlan = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Care Plans
      </Text>
      
      <ModernInput
        label="Care Plan"
        value={formData.carePlan}
        onChangeText={(value) => handleInputChange('carePlan', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="clipboard" size={20} color={theme.colors.primary} />}
        placeholder="Detailed care plan for the patient"
      />
      
      <ModernInput
        label="Treatment Goals"
        value={formData.treatmentGoals}
        onChangeText={(value) => handleInputChange('treatmentGoals', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="target" size={20} color={theme.colors.primary} />}
        placeholder="Short-term and long-term treatment goals"
      />
      
      <ModernInput
        label="Follow-up Schedule"
        value={formData.followUpSchedule}
        onChangeText={(value) => handleInputChange('followUpSchedule', value)}
        leftIcon={<ModernIcon name="calendar" size={20} color={theme.colors.primary} />}
        placeholder="Next appointment, follow-up intervals"
      />
    </ModernCard>
  );

  const renderDoctorNotes = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Doctor Notes
      </Text>
      
      <ModernInput
        label="Diagnosis"
        value={formData.diagnosis}
        onChangeText={(value) => handleInputChange('diagnosis', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="search" size={20} color={theme.colors.primary} />}
        placeholder="Primary and secondary diagnoses"
      />
      
      <ModernInput
        label="Treatment Plan"
        value={formData.treatmentPlan}
        onChangeText={(value) => handleInputChange('treatmentPlan', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="list" size={20} color={theme.colors.primary} />}
        placeholder="Detailed treatment plan and procedures"
      />
      
      <ModernInput
        label="Doctor Notes"
        value={formData.doctorNotes}
        onChangeText={(value) => handleInputChange('doctorNotes', value)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="edit-3" size={20} color={theme.colors.foregroundMuted} />}
        placeholder="Additional clinical notes and observations"
      />
      
      <ModernInput
        label="Recommendations"
        value={formData.recommendations}
        onChangeText={(value) => handleInputChange('recommendations', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        leftIcon={<ModernIcon name="thumbs-up" size={20} color={theme.colors.medicalSuccess} />}
        placeholder="Recommendations for patient and family"
      />
    </ModernCard>
  );

  const [appointmentFilter, setAppointmentFilter] = useState('upcoming');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Mock appointment history data
  const appointmentHistory = [
    {
      id: 'apt1',
      date: '12 Nov 2024',
      reason: 'Follow-up for hypertension management',
      doctorName: 'Dr. Smith',
      status: 'completed',
      notes: 'Blood pressure well controlled, continue current medication'
    },
    {
      id: 'apt2',
      date: '30 Aug 2024',
      reason: 'Chest pain evaluation',
      doctorName: 'Dr. Johnson',
      status: 'completed',
      notes: 'EKG normal, stress test recommended'
    },
    {
      id: 'apt3',
      date: '20 Jan 2024',
      reason: 'Annual physical examination',
      doctorName: 'Dr. Smith',
      status: 'completed',
      notes: 'Overall health good, diabetes management discussed'
    },
    {
      id: 'apt4',
      date: '15 Oct 2023',
      reason: 'Diabetes management',
      doctorName: 'Dr. Williams',
      status: 'completed',
      notes: 'HbA1c improved, medication adjusted'
    }
  ];

  const renderTimeline = (appointments: any[]) => {
    const pastAppointments = appointments.filter(apt => apt.status !== 'upcoming');
    
    return (
      <View style={styles.timelineContainer}>
        <Text style={[styles.timelineTitle, { color: theme.colors.foreground }]}>
          Medical Events Timeline
        </Text>
        <View style={styles.timelineWrapper}>
          <View style={styles.timelineLine} />
          {pastAppointments.map((appointment, index) => (
            <View key={appointment.id} style={styles.timelineItem}>
              <View style={[
                styles.timelineDot, 
                { 
                  backgroundColor: appointment.status === 'completed' ? '#10B981' : 
                                 appointment.status === 'cancelled' ? '#EF4444' : '#3B82F6'
                }
              ]} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineCard}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={[styles.timelineDate, { color: theme.colors.foreground }]}>
                      {appointment.date}
                    </Text>
                    <View style={[
                      styles.timelineStatus, 
                      { 
                        backgroundColor: appointment.status === 'completed' ? '#10B981' : 
                                       appointment.status === 'cancelled' ? '#EF4444' : '#3B82F6'
                      }
                    ]}>
                      <Text style={styles.timelineStatusText}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.timelineReason, { color: theme.colors.foreground }]}>
                    {appointment.reason}
                  </Text>
                  <Text style={[styles.timelineDoctor, { color: theme.colors.foregroundSecondary }]}>
                    {appointment.doctorName}
                  </Text>
                  {appointment.notes && (
                    <Text style={[styles.timelineNotes, { color: theme.colors.foregroundMuted }]}>
                      {appointment.notes}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMedicalEvents = () => (
    <ModernCard style={styles.sectionCard}>
      <View style={styles.medicalEventsHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Medical Events Timeline
        </Text>
        <ModernButton
          title={showTimeline ? "Hide Timeline" : "View Timeline"}
          variant={showTimeline ? "outline" : "gradient"}
          size="sm"
          onPress={() => setShowTimeline(!showTimeline)}
          leftIcon={<ModernIcon name={showTimeline ? "chevron-up" : "calendar"} size={16} color={showTimeline ? theme.colors.foreground : "#fff"} />}
        />
      </View>
      
      {showTimeline && (
        <View style={styles.timelineWrapper}>
          {renderTimeline(appointmentHistory)}
        </View>
      )}
    </ModernCard>
  );

  const renderAppointments = () => (
    <ModernCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        My Appointments
      </Text>
      
      <View style={styles.appointmentsContainer}>
        <View style={styles.appointmentFilters}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              appointmentFilter === 'upcoming' ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => setAppointmentFilter('upcoming')}
          >
            <Text style={[
              styles.filterButtonText, 
              appointmentFilter === 'upcoming' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
            ]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              appointmentFilter === 'past' ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => setAppointmentFilter('past')}
          >
            <Text style={[
              styles.filterButtonText, 
              appointmentFilter === 'past' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
            ]}>
              Past Appointments
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              appointmentFilter === 'all' ? styles.filterButtonActive : styles.filterButtonInactive
            ]}
            onPress={() => setAppointmentFilter('all')}
          >
            <Text style={[
              styles.filterButtonText, 
              appointmentFilter === 'all' ? styles.filterButtonTextActive : styles.filterButtonTextInactive
            ]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.appointmentSearchContainer}>
          <ModernInput
            placeholder="Search by name, condition, date..."
            value={appointmentSearch}
            onChangeText={setAppointmentSearch}
            leftIcon={<ModernIcon name="search" size={20} color={theme.colors.foregroundMuted} />}
            rightIcon={
              appointmentSearch ? 
                <TouchableOpacity onPress={() => setAppointmentSearch('')}>
                  <ModernIcon name="x" size={20} color={theme.colors.foregroundMuted} />
                </TouchableOpacity> : 
                undefined
            }
          />
        </View>
        
        <View style={styles.appointmentList}>
          {/* Sample appointment - would be replaced with filtered data from API */}
          <ModernCard variant="elevated" style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentName}>Raja</Text>
              <View style={styles.appointmentDetails}>
                <Text style={styles.appointmentDetail}>Male</Text>
                <Text style={styles.appointmentDetail}>30</Text>
                <Text style={styles.appointmentDetail}>909091</Text>
              </View>
            </View>
            <View style={styles.appointmentStatus}>
              <Text style={styles.appointmentStatusText}>Cold</Text>
              <Text style={styles.appointmentBookedText}>Booked apt</Text>
            </View>
          </ModernCard>
          
          {/* Example of another appointment */}
          <ModernCard variant="elevated" style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentName}>Sarah Johnson</Text>
              <View style={styles.appointmentDetails}>
                <Text style={styles.appointmentDetail}>Female</Text>
                <Text style={styles.appointmentDetail}>42</Text>
                <Text style={styles.appointmentDetail}>555-1234</Text>
              </View>
            </View>
            <View style={styles.appointmentStatus}>
              <View style={styles.appointmentCondition}>
                <ModernIcon name="activity" size={16} color={theme.colors.medicalWarning} />
                <Text style={[styles.appointmentStatusText, {marginLeft: 5}]}>Hypertension</Text>
              </View>
              <View style={styles.appointmentDate}>
                <ModernIcon name="calendar" size={16} color={theme.colors.primary} />
                <Text style={[styles.appointmentBookedText, {marginLeft: 5}]}>Oct 5, 2:30 PM</Text>
              </View>
            </View>
          </ModernCard>
        </View>
      </View>
    </ModernCard>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ModernHeader
        title={isEditMode ? "Edit Patient Information" : "Patient Information Form"}
        leftIcon={<ModernIcon name="arrow-left" size={20} color={theme.colors.foreground} />}
        onLeftPress={() => navigation.goBack()}
        rightIcon={<ModernIcon name="settings" size={20} color={theme.colors.foreground} />}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Patient Information Form - Following handwritten structure */}
          
          {/* Search Section */}
          {renderSearch()}
          
          {/* Patient Info Section */}
          {renderPatientDetails()}
          
          {/* Contact Details Section */}
          {renderContactInfo()}
          
          {/* Reports Section - Vitals */}
          {renderVitals()}
          
          {/* Impairments Section - Chief Complaint/Issues */}
          {renderChiefComplaint()}
          
          {/* Insurance Section - Medical History */}
          {renderMedicalHistory()}
          
          {/* Admission Information Section - Current Medication */}
          {renderCurrentMedication()}
          
          {/* Treatment/Termination & Information Section - Lifestyle & Habits */}
          {renderLifestyle()}
          
          {/* Care Plans Section */}
          {renderCarePlan()}
          
          {/* Doctor Notes Section */}
          {renderDoctorNotes()}
          
          {/* Medical Events Timeline Section */}
          {renderMedicalEvents()}
          
          {/* Patient Portal Section */}
          {renderPatientPortal()}
          
          {/* My Appointments Section */}
          {renderAppointments()}
          
          <View style={styles.buttonContainer}>
            <ModernButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.button}
            />
            <ModernButton
              title={saving ? "Saving..." : "Save"}
              onPress={handleSave}
              variant="gradient"
              style={styles.button}
              disabled={saving}
            />
          </View>
        </View>
      </ScrollView>

      <HamburgerMenu
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    width: '48%',
  },
  appointmentsContainer: {
    marginTop: 10,
  },
  appointmentFilters: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#2DD4BF',
  },
  filterButtonInactive: {
    backgroundColor: '#f5f5f5',
  },
  filterButtonText: {
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterButtonTextInactive: {
    color: '#666',
  },
  appointmentCondition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portalSection: {
    marginBottom: 16,
  },
  portalSectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  portalButtonContainer: {
    marginTop: 16,
  },
  portalButton: {
    width: '100%',
  },
  appointmentSearchContainer: {
    marginBottom: 16,
  },
  appointmentList: {
    marginBottom: 10,
  },
  appointmentCard: {
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
  },
  appointmentDetail: {
    marginLeft: 12,
    color: '#666',
  },
  appointmentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  appointmentStatusText: {
    color: '#666',
  },
  appointmentBookedText: {
    color: '#2DD4BF',
    fontWeight: '500',
  },
  // Timeline styles
  timelineContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  timelineWrapper: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  timelineStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timelineStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineReason: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDoctor: {
    fontSize: 14,
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Medical Events styles
  medicalEventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Layout improvements
  compactCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
  },
});

export default PatientInformationFormScreen;
