import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Alert,
  TextInput 
} from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import { Theme } from '../../themes';
import { useAppContext } from '../../context/AppContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';
import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import ModernInput from '../../components/ModernInput';
import { Calendar } from 'react-native-calendars';

type RootStackParamList = {
  AdminDashboard: undefined;
  PatientDetails: { patient: any };
};

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminDashboard'
>;

interface Props {
  navigation: AdminDashboardScreenNavigationProp;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

type AdminTab = 'overview' | 'doctors' | 'receptionists' | 'patients' | 'calendar' | 'reports' | 'settings';

const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const {
    clinicProfile,
    doctors,
    receptionists,
    appointments,
    addDoctor,
    removeDoctor,
    addReceptionist,
    removeReceptionist,
    logout,
    currentUser,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Patient-related state - moved to top level to avoid hooks in render functions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Doctor form states
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpeciality, setDoctorSpeciality] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  // Receptionist form states
  const [receptionistName, setReceptionistName] = useState('');
  const [receptionistEmail, setReceptionistEmail] = useState('');

  const handleAddDoctor = () => {
    if (!doctorName || !doctorSpeciality || !doctorEmail) {
      Alert.alert('Missing Info', 'Please fill all doctor fields');
      return;
    }

    addDoctor({
      name: doctorName,
      speciality: doctorSpeciality,
      email: doctorEmail,
      autoEmail: sendEmail,
    });

    setDoctorName('');
    setDoctorSpeciality('');
    setDoctorEmail('');
    Alert.alert('Success', 'Doctor added successfully!');
  };

  const handleAddReceptionist = () => {
    if (!receptionistName || !receptionistEmail) {
      Alert.alert('Missing Info', 'Please fill all receptionist fields');
      return;
    }

    addReceptionist({
      name: receptionistName,
      email: receptionistEmail,
    });

    setReceptionistName('');
    setReceptionistEmail('');
    Alert.alert('Success', 'Receptionist added successfully!');
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>      
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Dashboard Overview
      </Text>
      
      <View style={styles.statsGrid}>
        <ModernCard variant="default" style={styles.statCard}>
          <Icon name="users" size={32} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>
            {doctors.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
            Doctors
          </Text>
        </ModernCard>

        <ModernCard variant="default" style={styles.statCard}>
          <Icon name="user-check" size={32} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>
            {receptionists.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
            Receptionists
          </Text>
        </ModernCard>

        <ModernCard variant="default" style={styles.statCard}>
          <Icon name="calendar" size={32} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>
            {appointments.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
            Appointments
          </Text>
        </ModernCard>

        <ModernCard variant="default" style={styles.statCard}>
          <Icon name="home" size={32} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>
            {clinicProfile ? '1' : '0'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
            Clinics
          </Text>
      </ModernCard>      
              </View>              

      <ModernCard variant="default" style={styles.infoCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Clinic Information
        </Text>
        {clinicProfile ? (
          <>
            <Text style={[styles.infoText, { color: theme.colors.foreground }]}>
              <Text style={{ fontWeight: '600' }}>Name: </Text>
              {clinicProfile.clinicName}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.foreground }]}>
              <Text style={{ fontWeight: '600' }}>Admin: </Text>
              {clinicProfile.adminEmail}
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.foreground }]}>
              <Text style={{ fontWeight: '600' }}>Doctors: </Text>
              {clinicProfile.doctorRange}
            </Text>
          </>
        ) : (
          <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary }]}>
            No clinic profile configured
          </Text>
        )}
      </ModernCard>    
    </View>
  );

  const renderDoctors = () => (
    <View style={styles.tabContent}>      
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Manage Doctors
      </Text>

      <ModernCard variant="default" style={styles.formCard}>        
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Add New Doctor
        </Text>
        
        <ModernInput
          label="Doctor Name"
          value={doctorName}
          onChangeText={setDoctorName}
          placeholder="Dr. Jane Smith"
          leftIcon={<Icon name="user" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernInput
          label="Speciality"
          value={doctorSpeciality}
          onChangeText={setDoctorSpeciality}
          placeholder="Cardiologist"
          leftIcon={<Icon name="activity" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernInput
          label="Email"
          value={doctorEmail}
          onChangeText={setDoctorEmail}
          placeholder="doctor@clinic.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Icon name="mail" size={18} color={theme.colors.foregroundMuted} />}
        />

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSendEmail(!sendEmail)}
        >
          <Icon 
            name={sendEmail ? 'check-circle' : 'circle'} 
            size={20} 
            color={sendEmail ? theme.colors.primary : theme.colors.foregroundMuted} 
          />
          <Text style={[styles.checkboxLabel, { color: theme.colors.foreground }]}>
            Send email notification with credentials
          </Text>
        </TouchableOpacity>

        <ModernButton
          title="Add Doctor"
          variant="gradient"
          size="lg"
          onPress={handleAddDoctor}
          leftIcon={<Icon name="plus" size={18} color="#fff" />}
        />
      </ModernCard>      

      <ModernCard variant="default" style={styles.listCard}>        
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Doctors List ({doctors.length})
        </Text>

        {doctors.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.foregroundSecondary }]}>
            No doctors added yet
          </Text>
        ) : (
          doctors.map((doctor) => (
            <View key={doctor.id} style={[styles.listItem, { borderColor: theme.colors.border }]}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemIcon}>
                  <Icon name="user" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemTitle, { color: theme.colors.foreground }]}>
                    {doctor.name}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: theme.colors.foregroundSecondary }]}>
                    {doctor.speciality}
                  </Text>
                  <Text style={[styles.listItemEmail, { color: theme.colors.foregroundMuted }]}>
                    {doctor.email}
                  </Text>
                  <Text style={[styles.listItemMeta, { color: theme.colors.foregroundMuted }]}>
                    Password: {doctor.temporaryPassword}
                  </Text>
                </View>
              </View>
              <ModernButton
                title="Remove"
                variant="outline"
                size="sm"
                onPress={() => {
                  Alert.alert(
                    'Remove Doctor',
                    `Are you sure you want to remove ${doctor.name}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Remove', 
                        style: 'destructive',
                        onPress: () => removeDoctor(doctor.id)
                      },
                    ]
                  );
                }}
                textStyle={{ color: theme.colors.error }}
              />
              </View>              
          ))
        )}
      </ModernCard>    
    </View>
  );

  const renderReceptionists = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Manage Receptionists
      </Text>

      <ModernCard variant="default" style={styles.formCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Add New Receptionist
        </Text>
        
        <ModernInput
          label="Name"
          value={receptionistName}
          onChangeText={setReceptionistName}
          placeholder="Sarah Johnson"
          leftIcon={<Icon name="user" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernInput
          label="Email"
          value={receptionistEmail}
          onChangeText={setReceptionistEmail}
          placeholder="reception@clinic.com"
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Icon name="mail" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernButton
          title="Add Receptionist"
          variant="gradient"
          size="lg"
          onPress={handleAddReceptionist}
          leftIcon={<Icon name="plus" size={18} color="#fff" />}
        />
      </ModernCard>

      <ModernCard variant="default" style={styles.listCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Receptionists List ({receptionists.length})
        </Text>

        {receptionists.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.foregroundSecondary }]}>
            No receptionists added yet
          </Text>
        ) : (
          receptionists.map((receptionist) => (
            <View key={receptionist.id} style={[styles.listItem, { borderColor: theme.colors.border }]}>
              <View style={styles.listItemContent}>
                <View style={styles.listItemIcon}>
                  <Icon name="user-check" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemTitle, { color: theme.colors.foreground }]}>
                    {receptionist.name}
                  </Text>
                  <Text style={[styles.listItemEmail, { color: theme.colors.foregroundMuted }]}>
                    {receptionist.email}
                  </Text>
                  <Text style={[styles.listItemMeta, { color: theme.colors.foregroundMuted }]}>
                    Password: {receptionist.temporaryPassword}
                  </Text>
                </View>
              </View>
              <ModernButton
                title="Remove"
                variant="outline"
                size="sm"
                onPress={() => {
                  Alert.alert(
                    'Remove Receptionist',
                    `Are you sure you want to remove ${receptionist.name}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Remove', 
                        style: 'destructive',
                        onPress: () => removeReceptionist(receptionist.id)
                      },
                    ]
                  );
                }}
                textStyle={{ color: theme.colors.error }}
              />
            </View>
          ))
        )}
      </ModernCard>
    </View>
  );

  // Move the useState hook outside the render function to avoid the "Rendered more hooks than during the previous render" error
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const renderCalendar = () => {
    const today = new Date().toISOString().split('T')[0];

    // Create marked dates from appointments
    const markedDates: any = {};
    appointments.forEach(apt => {
      if (!markedDates[apt.date]) {
        markedDates[apt.date] = { 
          marked: true, 
          dotColor: theme.colors.primary,
        };
      }
    });
    
    // Add selected date
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: theme.colors.primary,
    };
    
    // Get appointments for selected date
    const selectedDateAppointments = appointments.filter(apt => apt.date === selectedDate);

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Calendar View
            </Text>

          <ModernCard variant="default" style={styles.calendarCard}>
            <Calendar
              current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.foregroundSecondary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.surface,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.foreground,
                textDisabledColor: theme.colors.foregroundMuted,
                dotColor: theme.colors.primary,
                selectedDotColor: theme.colors.surface,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.foreground,
                indicatorColor: theme.colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
                textDayFontSize: IS_TABLET ? 16 : 14,
                textMonthFontSize: IS_TABLET ? 18 : 16,
                textDayHeaderFontSize: IS_TABLET ? 14 : 12,
              }}
            />
          </ModernCard>
          
        <ModernCard variant="default" style={styles.infoCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            {selectedDate === today ? "Today's Appointments" : `Appointments for ${selectedDate}`}
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary }]}>
            {selectedDateAppointments.length} appointment(s)
          </Text>
          
          {selectedDateAppointments.length > 0 ? (
            <View style={{ width: '100%', gap: 12, marginTop: 12 }}>
              {selectedDateAppointments.map(apt => (
                <View key={apt.id} style={[styles.listItem, { borderColor: theme.colors.border }]}>
                  <View style={styles.listItemContent}>
                    <View style={styles.listItemIcon}>
                      <Icon name="calendar" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={[styles.listItemTitle, { color: theme.colors.foreground }]}>
                        {apt.patientFirstName} {apt.patientLastName}
                      </Text>
                      <Text style={[styles.listItemEmail, { color: theme.colors.foregroundMuted }]}>
                        {apt.time} - {apt.doctorName}
                      </Text>
                      <Text style={[styles.listItemMeta, { color: theme.colors.foregroundMuted }]}>
                        {apt.reason || 'General consultation'}
              </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.foregroundSecondary }]}>
              No appointments for this date
            </Text>
          )}
        </ModernCard>

        <ModernCard variant="default" style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
            Quick Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {appointments.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
                Total Appointments
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {appointments.filter(apt => apt.date === today).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
                Today
                  </Text>
            </View>
          </View>
                </ModernCard>
      </View>
    );
  };

  const renderReports = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Reports & Analytics
                        </Text>

      <ModernCard variant="default" style={styles.infoCard}>
        <Icon name="clipboard" size={48} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Analytics Coming Soon
                          </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary, textAlign: 'center' }]}>
          View clinic performance metrics, doctor utilization, and appointment statistics
                      </Text>
                    </ModernCard>
                </View>
  );
        
  const renderSettings = () => (
    <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Settings
            </Text>
            
      <ModernCard variant="default" style={styles.infoCard}>
        <Icon name="settings" size={48} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          System Settings
                  </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary, textAlign: 'center' }]}>
          Configure clinic hours, email templates, and notification settings
                  </Text>
      </ModernCard>
                </View>
  );

  const renderPatients = () => {
    // Mock patient data with comprehensive information
    
    const mockPatients = [
      {
        id: '1',
        patientId: 'P001',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        age: '45',
        bloodGroup: 'A+',
        dateOfBirth: '15/03/1979',
        email: 'john.doe@email.com',
        phone: '555-0123',
        address: '123 Main St, City, State',
        vitals: {
          bloodPressure: '120/80',
          heartRate: '72',
          temperature: '98.6°F',
          oxygenSaturation: '98%',
          weight: '75kg',
          height: '175cm',
          bmi: '24.5'
        },
        // Static patient data
        medicalHistory: 'Hypertension, Type 2 Diabetes',
        allergies: 'Penicillin',
        familyHistory: 'Father had heart disease',
        previousSurgeries: 'Appendectomy (1995)',
        currentMedication: 'Metformin 500mg, Lisinopril 10mg',
        medicationDosage: 'Metformin: 500mg, Lisinopril: 10mg',
        medicationFrequency: 'Twice daily',
        lastMedicationReview: '01/10/2024',
        lifestyle: {
          smoking: 'Former (quit 5 years ago)',
          alcohol: 'Occasional',
          exercise: 'Light',
          diet: 'Regular',
          sleep: '7-8 hours',
          stress: 'Moderate'
        },
        appointmentHistory: [
          {
            id: 'apt1',
            date: '12 Nov 2024',
            reason: 'Follow-up for hypertension management',
            doctorName: 'Dr. Smith',
            status: 'completed',
            chiefComplaint: 'Routine follow-up for blood pressure monitoring',
            currentSymptoms: 'No new symptoms, feeling well',
            painLevel: '0',
            vitals: {
              bloodPressure: '125/82',
              heartRate: '68',
              temperature: '98.4°F',
              oxygenSaturation: '98%',
              weight: '75kg',
              height: '175cm'
            },
            diagnosis: 'Hypertension well controlled',
            treatmentPlan: 'Continue current medication, monitor BP weekly',
            doctorNotes: 'Blood pressure well controlled, continue current medication. Patient reports good compliance.',
            recommendations: 'Continue low-sodium diet, regular exercise, stress management',
            prescriptions: ['Lisinopril 10mg daily', 'Metformin 500mg twice daily']
          },
          {
            id: 'apt2',
            date: '30 Aug 2024',
            reason: 'Chest pain evaluation',
            doctorName: 'Dr. Johnson',
            status: 'completed',
            chiefComplaint: 'Chest discomfort and shortness of breath',
            currentSymptoms: 'Mild chest pain during exercise, occasional shortness of breath',
            painLevel: '4',
            vitals: {
              bloodPressure: '140/90',
              heartRate: '85',
              temperature: '98.6°F',
              oxygenSaturation: '96%',
              weight: '76kg',
              height: '175cm'
            },
            diagnosis: 'Possible angina, rule out cardiac causes',
            treatmentPlan: 'EKG normal, stress test recommended, cardiology referral',
            doctorNotes: 'EKG normal, stress test recommended. Patient reports chest pain during physical activity.',
            recommendations: 'Avoid strenuous exercise until stress test, monitor symptoms',
            prescriptions: ['Aspirin 81mg daily', 'Nitroglycerin as needed']
          },
          {
            id: 'apt3',
            date: '20 Jan 2024',
            reason: 'Annual physical examination',
            doctorName: 'Dr. Smith',
            status: 'completed',
            chiefComplaint: 'Annual wellness checkup',
            currentSymptoms: 'No acute symptoms',
            painLevel: '0',
            vitals: {
              bloodPressure: '130/85',
              heartRate: '72',
              temperature: '98.5°F',
              oxygenSaturation: '97%',
              weight: '74kg',
              height: '175cm'
            },
            diagnosis: 'Overall health good, diabetes management discussed',
            treatmentPlan: 'Continue current medications, annual labs',
            doctorNotes: 'Overall health good, diabetes management discussed. Patient stable on current regimen.',
            recommendations: 'Continue healthy lifestyle, regular monitoring',
            prescriptions: ['Metformin 500mg twice daily', 'Lisinopril 10mg daily']
          },
          {
            id: 'apt4',
            date: '15 Oct 2023',
            reason: 'Diabetes management',
            doctorName: 'Dr. Williams',
            status: 'completed',
            chiefComplaint: 'Diabetes follow-up and medication adjustment',
            currentSymptoms: 'Increased thirst, frequent urination',
            painLevel: '0',
            vitals: {
              bloodPressure: '135/88',
              heartRate: '78',
              temperature: '98.3°F',
              oxygenSaturation: '98%',
              weight: '78kg',
              height: '175cm'
            },
            diagnosis: 'Type 2 Diabetes, HbA1c improved',
            treatmentPlan: 'HbA1c improved, medication adjusted, continue monitoring',
            doctorNotes: 'HbA1c improved from 8.2% to 7.1%, medication adjusted. Good progress.',
            recommendations: 'Continue diet modifications, regular blood sugar monitoring',
            prescriptions: ['Metformin 1000mg twice daily', 'Glipizide 5mg daily']
          }
        ]
      },
      {
        id: '2',
        patientId: 'P002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'Female',
        age: '32',
        bloodGroup: 'B-',
        dateOfBirth: '22/07/1992',
        email: 'sarah.j@email.com',
        phone: '555-0456',
        address: '456 Oak Ave, City, State',
        vitals: {
          bloodPressure: '110/70',
          heartRate: '68',
          temperature: '98.4°F',
          oxygenSaturation: '99%',
          weight: '62kg',
          height: '165cm',
          bmi: '22.8'
        },
        // Static patient data
        medicalHistory: 'None',
        allergies: 'None known',
        familyHistory: 'Mother had breast cancer',
        previousSurgeries: 'None',
        currentMedication: 'None',
        medicationDosage: 'N/A',
        medicationFrequency: 'N/A',
        lastMedicationReview: 'N/A',
        lifestyle: {
          smoking: 'Never',
          alcohol: 'Occasional',
          exercise: 'Moderate',
          diet: 'Vegetarian',
          sleep: '8 hours',
          stress: 'Low'
        },
        appointmentHistory: [
          {
            id: 'apt5',
            date: '05 Nov 2024',
            reason: 'Annual wellness checkup',
            doctorName: 'Dr. Brown',
            status: 'completed',
            chiefComplaint: 'Annual wellness checkup',
            currentSymptoms: 'None',
            painLevel: '0',
            vitals: {
              bloodPressure: '110/70',
              heartRate: '65',
              temperature: '98.2°F',
              oxygenSaturation: '99%',
              weight: '62kg',
              height: '165cm'
            },
            diagnosis: 'Healthy',
            treatmentPlan: 'Continue healthy lifestyle',
            doctorNotes: 'All vitals normal, excellent health status. Patient maintains good health habits.',
            recommendations: 'Continue current lifestyle, regular exercise',
            prescriptions: []
          },
          {
            id: 'apt6',
            date: '18 Jul 2024',
            reason: 'Routine follow-up',
            doctorName: 'Dr. Brown',
            status: 'completed',
            chiefComplaint: 'Routine follow-up visit',
            currentSymptoms: 'None',
            painLevel: '0',
            vitals: {
              bloodPressure: '108/68',
              heartRate: '62',
              temperature: '98.1°F',
              oxygenSaturation: '98%',
              weight: '61kg',
              height: '165cm'
            },
            diagnosis: 'Healthy',
            treatmentPlan: 'Continue healthy lifestyle',
            doctorNotes: 'No concerns, continue healthy lifestyle. Patient doing well.',
            recommendations: 'Maintain current health habits',
            prescriptions: []
          },
          {
            id: 'apt7',
            date: '10 Mar 2024',
            reason: 'Preventive screening',
            doctorName: 'Dr. Davis',
            status: 'completed',
            chiefComplaint: 'Preventive screening and mammogram',
            currentSymptoms: 'None',
            painLevel: '0',
            vitals: {
              bloodPressure: '112/72',
              heartRate: '68',
              temperature: '98.3°F',
              oxygenSaturation: '98%',
              weight: '62kg',
              height: '165cm'
            },
            diagnosis: 'Normal screening results',
            treatmentPlan: 'Continue regular screening schedule',
            doctorNotes: 'Mammogram and blood work normal. All screening tests within normal limits.',
            recommendations: 'Continue annual screenings, maintain healthy lifestyle',
            prescriptions: []
          }
        ]
      }
    ];

    const filteredPatients = mockPatients.filter(patient =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
    );

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
                    <TouchableOpacity 
                      style={styles.timelineCard}
                      onPress={() => setSelectedAppointment(appointment)}
                      activeOpacity={0.7}
                    >
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
                    </TouchableOpacity>
                  </View>
              </View>
            ))}
          </View>
        </View>
    );
  };


    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Patient Records
        </Text>

        <ModernCard variant="default" style={styles.searchCard}>
          <Icon name="search" size={24} color={theme.colors.foregroundMuted} />
          <Text style={[styles.searchPlaceholder, { color: theme.colors.foregroundMuted }]}>
            Search patients by name, phone, or ID
          </Text>
        </ModernCard>

        <View>
          {filteredPatients.map((patient) => (
            <ModernCard key={patient.id} variant="default" style={styles.patientCard}>
              <TouchableOpacity
                onPress={() => navigation.navigate('PatientDetails', { patient })}
                style={styles.patientCardContent}
              >
                <View style={styles.patientHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                      {patient.firstName} {patient.lastName}
                    </Text>
                    <Text style={[styles.patientId, { color: theme.colors.foregroundSecondary }]}>
                      ID: {patient.patientId} | {patient.age} years, {patient.gender}
                    </Text>
                    <Text style={[styles.patientPhone, { color: theme.colors.foregroundMuted }]}>
                      {patient.phone}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={theme.colors.foregroundMuted} />
                </View>
              </TouchableOpacity>
            </ModernCard>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'doctors':
        return renderDoctors();
      case 'receptionists':
        return renderReceptionists();
      case 'patients':
        return renderPatients();
      case 'calendar':
        return renderCalendar();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  const renderAppointmentModal = () => {
    if (!selectedAppointment) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>
              Appointment Details
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedAppointment(null)}
            >
              <ModernIcon name="x" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Appointment Header */}
            <View style={[
              styles.modalAppointmentHeader,
              { 
                backgroundColor: selectedAppointment.status === 'completed' ? '#10B981' : 
                               selectedAppointment.status === 'cancelled' ? '#EF4444' : '#3B82F6'
              }
            ]}>
              <Text style={styles.modalAppointmentDate}>{selectedAppointment.date}</Text>
              <Text style={styles.modalAppointmentDoctor}>{selectedAppointment.doctorName}</Text>
              <View style={styles.modalAppointmentStatus}>
                <Text style={styles.modalAppointmentStatusText}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Grid Layout for Information */}
            <View style={styles.modalGridContainer}>
              {/* Row 1: Chief Complaint & Current Symptoms */}
              <View style={styles.modalGridRow}>
                <View style={[styles.modalGridItem, styles.modalGridItemFull]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Chief Complaint
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.chiefComplaint}
                  </Text>
                </View>
              </View>

              <View style={styles.modalGridRow}>
                <View style={[styles.modalGridItem, styles.modalGridItemFull]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Current Symptoms
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.currentSymptoms}
                  </Text>
                </View>
              </View>

              {/* Row 2: Pain Level & Diagnosis */}
              <View style={styles.modalGridRow}>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Pain Level
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.painLevel}/10
                  </Text>
                </View>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Diagnosis
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.diagnosis}
                  </Text>
                </View>
              </View>

              {/* Row 3: Treatment Plan & Doctor Notes */}
              <View style={styles.modalGridRow}>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Treatment Plan
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.treatmentPlan}
                  </Text>
                </View>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Doctor Notes
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.doctorNotes}
                  </Text>
                </View>
              </View>

              {/* Row 4: Recommendations & Prescriptions */}
              <View style={styles.modalGridRow}>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Recommendations
                  </Text>
                  <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                    {selectedAppointment.recommendations}
                  </Text>
                </View>
                <View style={[styles.modalGridItem, styles.modalGridItemHalf]}>
                  <Text style={[styles.modalSectionTitle, { color: theme.colors.foreground }]}>
                    Prescriptions
                  </Text>
                  {selectedAppointment.prescriptions && selectedAppointment.prescriptions.length > 0 ? (
                    selectedAppointment.prescriptions.map((prescription: string, index: number) => (
                      <Text key={index} style={[styles.modalPrescription, { color: theme.colors.foregroundSecondary }]}>
                        • {prescription}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.modalSectionContent, { color: theme.colors.foregroundSecondary }]}>
                      No prescriptions
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'home' },
    { key: 'doctors', label: 'Doctors', icon: 'users' },
    { key: 'receptionists', label: 'Receptionists', icon: 'user-check' },
    { key: 'patients', label: 'Patients', icon: 'user' },
    { key: 'calendar', label: 'Calendar', icon: 'calendar' },
    { key: 'reports', label: 'Reports', icon: 'clipboard' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Logo width={40} height={40} />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>
                Admin Console
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.foregroundSecondary }]}>
                {clinicProfile?.clinicName || currentUser?.name || 'MediEase Clinic'}
                    </Text>
                  </View>
                </View>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.colors.error + '10' }]}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: logout },
                ]
              );
            }}
          >
            <Icon name="log-out" size={20} color={theme.colors.error} />
            {IS_TABLET && (
              <Text style={[styles.logoutText, { color: theme.colors.error }]}>
                Logout
                </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.key ? '#fff' : theme.colors.primary} 
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.key ? '#fff' : theme.colors.foreground },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderContent()}
      </ScrollView>

      {/* Appointment Modal */}
      {renderAppointmentModal()}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: IS_TABLET ? 24 : 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: IS_TABLET ? 14 : 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  tabText: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  tabContent: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: IS_TABLET ? 200 : 150,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: IS_TABLET ? 36 : 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  formCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 16,
  },
  listCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 16,
  },
  infoCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 12,
    alignItems: 'center',
  },
  calendarCard: {
    padding: 16,
  },
  cardTitle: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  infoText: {
    fontSize: IS_TABLET ? 16 : 14,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: IS_TABLET ? 16 : 14,
    flex: 1,
  },
  emptyText: {
    fontSize: IS_TABLET ? 16 : 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemInfo: {
    flex: 1,
    gap: 4,
  },
  listItemTitle: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  listItemSubtitle: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  listItemEmail: {
    fontSize: IS_TABLET ? 14 : 12,
  },
  listItemMeta: {
    fontSize: IS_TABLET ? 12 : 11,
  },
  statsCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  searchPlaceholder: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  patientDetailsContainer: {
    marginTop: 16,
  },
  patientDetailsTitle: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  patientDetailsLayout: {
    flexDirection: IS_TABLET ? 'row' : 'column',
    gap: 20,
  },
  patientInfoColumn: {
    flex: IS_TABLET ? 0.6 : 1,
  },
  patientInfoScroll: {
    flex: 1,
  },
  timelineColumn: {
    flex: IS_TABLET ? 0.4 : 1,
  },
  patientInfoCard: {
    marginBottom: 16,
  },
  patientInfoTitle: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  patientInfoText: {
    fontSize: IS_TABLET ? 14 : 13,
    lineHeight: 20,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lifestyleItem: {
    flex: 1,
    minWidth: '45%',
  },
  lifestyleLabel: {
    fontSize: IS_TABLET ? 12 : 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  lifestyleValue: {
    fontSize: IS_TABLET ? 14 : 13,
    fontWeight: '600',
  },
  patientInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  patientInfoItem: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 12,
  },
  patientInfoLabel: {
    fontSize: IS_TABLET ? 12 : 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  patientInfoValue: {
    fontSize: IS_TABLET ? 14 : 13,
    fontWeight: '600',
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  vitalItem: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  vitalLabel: {
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  patientCardContent: {
    width: '100%',
  },
  patientComplaint: {
    fontSize: IS_TABLET ? 14 : 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  patientCard: {
    padding: IS_TABLET ? 20 : 16,
    gap: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  patientInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  patientId: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  patientPhone: {
    fontSize: IS_TABLET ? 14 : 12,
  },
  timelineContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineTitle: {
    fontSize: IS_TABLET ? 18 : 16,
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
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
  },
  timelineStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timelineStatusText: {
    color: '#fff',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '600',
  },
  timelineReason: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDoctor: {
    fontSize: IS_TABLET ? 14 : 12,
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: IS_TABLET ? 14 : 12,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    margin: 4,
    maxHeight: '98%',
    width: '99%',
    maxWidth: 900,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  modalContent: {
    maxHeight: '70%',
  },
  modalAppointmentHeader: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
  },
  modalAppointmentDate: {
    color: '#fff',
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalAppointmentDoctor: {
    color: '#fff',
    fontSize: IS_TABLET ? 14 : 12,
    opacity: 0.9,
    marginBottom: 8,
  },
  modalAppointmentStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalAppointmentStatusText: {
    color: '#fff',
    fontSize: IS_TABLET ? 12 : 10,
    fontWeight: '600',
  },
  modalSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalSectionTitle: {
    fontSize: IS_TABLET ? 16 : 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalSectionContent: {
    fontSize: IS_TABLET ? 14 : 13,
    lineHeight: 20,
  },
  modalPrescription: {
    fontSize: IS_TABLET ? 14 : 13,
    marginBottom: 4,
    paddingLeft: 8,
  },
  // Grid Layout Styles
  modalGridContainer: {
    padding: 16,
  },
  modalGridRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  modalGridItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalGridItemFull: {
    flex: 1,
  },
  modalGridItemHalf: {
    flex: 1,
  },
});

export default AdminDashboardScreen;
