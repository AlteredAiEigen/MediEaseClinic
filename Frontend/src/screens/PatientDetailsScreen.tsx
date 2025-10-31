import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from '../components/Icon';
import ModernCard from '../components/ModernCard';
import ModernIcon from '../components/ModernIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

export type RootStackParamList = {
  AdminDashboard: undefined;
  DoctorDashboard: undefined;
  PatientDetails: { patient: any };
};

type PatientDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PatientDetails'
>;

type PatientDetailsScreenRouteProp = RouteProp<RootStackParamList, 'PatientDetails'>;

interface Props {
  navigation: PatientDetailsScreenNavigationProp;
  route: PatientDetailsScreenRouteProp;
}

const PatientDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { patient } = route.params;
  
  // Navigation state
  const [activeSection, setActiveSection] = React.useState('overview');
  const [showTopMenu, setShowTopMenu] = React.useState(false);
  const [showNotesPopup, setShowNotesPopup] = React.useState(false);
  const [newNote, setNewNote] = React.useState('');

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

  const renderPatientDetails = (patient: any) => (
    <View style={styles.patientDetailsContainer}>
      <Text style={[styles.patientDetailsTitle, { color: theme.colors.foreground }]}>
        Patient Information
      </Text>
      
      <View style={styles.patientDetailsLayout}>
        {/* Left Column - Static Patient Information */}
        <View style={styles.patientInfoColumn}>
          <ScrollView style={styles.patientInfoScroll} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <ModernCard style={styles.patientInfoCard}>
              <Text style={[styles.patientInfoTitle, { color: theme.colors.foreground }]}>
                Basic Information
              </Text>
              <View style={styles.patientInfoGrid}>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Name
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.firstName} {patient.lastName}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Patient ID
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.patientId}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Date of Birth
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.dateOfBirth}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Age
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.age} years
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Gender
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.gender}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Blood Group
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.bloodGroup}
                  </Text>
                </View>
              </View>
            </ModernCard>

            {/* Contact Information */}
            <ModernCard style={styles.patientInfoCard}>
              <Text style={[styles.patientInfoTitle, { color: theme.colors.foreground }]}>
                Contact Information
              </Text>
              <View style={styles.patientInfoGrid}>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Email
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.email}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Phone
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.phone}
                  </Text>
                </View>
                <View style={styles.patientInfoItem}>
                  <Text style={[styles.patientInfoLabel, { color: theme.colors.foregroundSecondary }]}>
                    Address
                  </Text>
                  <Text style={[styles.patientInfoValue, { color: theme.colors.foreground }]}>
                    {patient.address}
                  </Text>
                </View>
              </View>
            </ModernCard>

            {/* Medical History */}
            <ModernCard style={styles.patientInfoCard}>
              <Text style={[styles.patientInfoTitle, { color: theme.colors.foreground }]}>
                Medical History
              </Text>
              <Text style={[styles.patientInfoText, { color: theme.colors.foregroundSecondary }]}>
                {patient.medicalHistory}
              </Text>
            </ModernCard>

            {/* Allergies */}
            <ModernCard style={styles.patientInfoCard}>
              <Text style={[styles.patientInfoTitle, { color: theme.colors.foreground }]}>
                Allergies
              </Text>
              <Text style={[styles.patientInfoText, { color: theme.colors.foregroundSecondary }]}>
                {patient.allergies}
              </Text>
            </ModernCard>

            {/* Current Medications */}
            <ModernCard style={styles.patientInfoCard}>
              <Text style={[styles.patientInfoTitle, { color: theme.colors.foreground }]}>
                Current Medications
              </Text>
              <Text style={[styles.patientInfoText, { color: theme.colors.foregroundSecondary }]}>
                {patient.currentMedication}
              </Text>
            </ModernCard>

        
          </ScrollView>
        </View>

        {/* Right Column - Medical Events Timeline */}
        <View style={styles.timelineColumn}>
          {patient.appointmentHistory && patient.appointmentHistory.length > 0 && (
            renderTimeline(patient.appointmentHistory)
          )}
        </View>
      </View>
    </View>
  );

  // New Card-Based Render Functions
 // ... existing code ...

const renderPatientHeaderCard = (patient: any) => (
  <ModernCard variant="elevated" style={styles.patientHeaderCard}>
    <LinearGradient
      colors={[theme.colors.primaryAlphaDark, theme.colors.primaryAlpha]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.patientHeaderGradient}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        {/* Left section with Avatar, Name, Complaint... */}
        <View style={{ flex: 1, alignItems: 'center', paddingRight: 16 }}>
          {/* Avatar, Name, Complaint */}
          <View style={styles.patientAvatar}>
            <View style={styles.patientAvatarBorder}>
              <Text style={styles.patientAvatarText}>
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
              </Text>
            </View>
          </View>
          <Text style={[styles.patientName, { color: theme.colors.foreground, marginTop: 12 }]}>
            {patient.firstName} {patient.lastName}
          </Text>
          <View style={styles.patientConditionBadge}>
            <Text style={[styles.patientCondition, { color: theme.colors.primary }]}>
              {patient.chiefComplaint || 'General Consultation'}
            </Text>
          </View>
          {/* DOB & Age row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 20, marginBottom: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.demographicLabel, { color: theme.colors.foregroundMuted }]}>DOB:</Text>
              <Text style={[styles.demographicValue, { color: theme.colors.foreground }]}>{patient.dateOfBirth}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.demographicLabel, { color: theme.colors.foregroundMuted }]}>Age:</Text>
              <Text style={[styles.demographicValue, { color: theme.colors.foreground }]}>{patient.age}y</Text>
            </View>
          </View>
          {/* Weight & Height row */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.demographicLabel, { color: theme.colors.foregroundMuted }]}>Weight:</Text>
              <Text style={[styles.demographicValue, { color: theme.colors.foreground }]}>{patient.vitals?.weight || '75kg'}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.demographicLabel, { color: theme.colors.foregroundMuted }]}>Height:</Text>
              <Text style={[styles.demographicValue, { color: theme.colors.foreground }]}>{patient.vitals?.height || '175cm'}</Text>
            </View>
          </View>
          {/* Send Message button */}
          <View style={{ alignItems: 'center', width: '100%' }}>
            <TouchableOpacity style={styles.messageButton}>
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.messageButtonGradient}
              >
                <Text style={styles.messageButtonText}>SEND MESSAGE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right section with Contact Information */}
        <View style={[styles.contactInfoSection, { flex: 0.8, paddingLeft: 16 }]}>
          <View style={styles.contactInfoItem}>
            <View style={styles.contactIconContainer}>
              <ModernIcon name="home" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.contactInfoText, { color: theme.colors.foreground }]}>
              {patient.address || '123 Broadway, New York, NY, 10012'}
            </Text>
          </View>
          <View style={styles.contactInfoItem}>
            <View style={styles.contactIconContainer}>
              <ModernIcon name="phone" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.contactInfoText, { color: theme.colors.foreground }]}>
              Mobile: {patient.phone || '917 (543)-1234'}
            </Text>
          </View>
          <View style={styles.contactInfoItem}>
            <View style={styles.contactIconContainer}>
              <ModernIcon name="mail" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.contactInfoText, { color: theme.colors.foreground }]}>
              {patient.email || 'j.smith@gmail.com'}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  </ModernCard>
);
  
  const renderContactCard = (patient: any) => (
    <ModernCard style={styles.contactCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Contact Information</Text>
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <ModernIcon name="home" size={16} color={theme.colors.primary} />
          <Text style={[styles.contactText, { color: theme.colors.foreground }]}>{patient.address}</Text>
        </View>
        <View style={styles.contactItem}>
          <ModernIcon name="phone" size={16} color={theme.colors.primary} />
          <Text style={[styles.contactText, { color: theme.colors.foreground }]}>Mobile: {patient.phone}</Text>
        </View>
        <View style={styles.contactItem}>
          <ModernIcon name="mail" size={16} color={theme.colors.primary} />
          <Text style={[styles.contactText, { color: theme.colors.foreground }]}>{patient.email}</Text>
        </View>
      </View>
    </ModernCard>
  );

  const renderMedicationsCard = (patient: any) => (
    <ModernCard style={styles.medicationsCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Current medications</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Add Medication', 'Add new medication functionality')}
        >
          <ModernIcon name="plus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.medicationsList}>
        {patient.currentMedication ? (
          <View style={styles.medicationItem}>
            <ModernIcon name="capsule" size={16} color={theme.colors.primary} />
            <Text style={[styles.medicationText, { color: theme.colors.foreground }]}>{patient.currentMedication}</Text>
          </View>
        ) : (
          <View style={styles.medicationItem}>
            <ModernIcon name="capsule" size={16} color={theme.colors.foregroundMuted} />
            <Text style={[styles.emptyText, { color: theme.colors.foregroundMuted }]}>No medications listed</Text>
          </View>
        )}
      </View>
    </ModernCard>
  );

  const renderVitalsCard = (patient: any) => (
    <ModernCard style={styles.vitalsCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Vitals</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Add Vitals', 'Add new vital signs functionality')}
        >
          <ModernIcon name="plus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.vitalsHorizontal}>
        <View style={styles.vitalItemHorizontal}>
          <ModernIcon name="heart" size={20} color="#EF4444" />
          <Text style={[styles.vitalValueHorizontal, { color: theme.colors.foreground }]}>{patient.vitals?.bloodPressure || '120/80'}</Text>
          <Text style={[styles.vitalLabelHorizontal, { color: theme.colors.foregroundMuted }]}>Blood Pressure</Text>
        </View>
        <View style={styles.vitalItemHorizontal}>
          <ModernIcon name="pulse" size={20} color="#10B981" />
          <Text style={[styles.vitalValueHorizontal, { color: theme.colors.foreground }]}>{patient.vitals?.heartRate || '72'} BPM</Text>
          <Text style={[styles.vitalLabelHorizontal, { color: theme.colors.foregroundMuted }]}>Pulse</Text>
        </View>
      </View>
    </ModernCard>
  );

  // Add this new function after renderContactCard
const renderLifestyleCard = (patient: any) => (
  <ModernCard style={styles.lifestyleCard}>
    <View style={styles.cardHeader}>
      <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Lifestyle</Text>
    </View>
    <View style={styles.lifestyleGrid}>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Smoking
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.smoking || 'Non-smoker'}
        </Text>
      </View>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Alcohol
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.alcohol || 'Occasional'}
        </Text>
      </View>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Exercise
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.exercise || 'Regular'}
        </Text>
      </View>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Diet
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.diet || 'Balanced'}
        </Text>
      </View>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Sleep
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.sleep || '7-8 hours'}
        </Text>
      </View>
      <View style={styles.lifestyleItem}>
        <Text style={[styles.lifestyleLabel, { color: theme.colors.foregroundSecondary }]}>
          Stress
        </Text>
        <Text style={[styles.lifestyleValue, { color: theme.colors.foreground }]}>
          {patient.lifestyle?.stress || 'Moderate'}
        </Text>
      </View>
    </View>
  </ModernCard>
);

  const renderNotesCard = (patient: any) => (
    <ModernCard style={styles.notesCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Notes</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowNotesPopup(true)}
        >
          <ModernIcon name="plus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.notesContent}>
        <Text style={[styles.noteText, { color: theme.colors.foreground }]}>
          {patient.doctorNotes || 'No notes available'}
        </Text>
      </View>
    </ModernCard>
  );

  const renderLabResultsCard = (patient: any) => (
    <ModernCard style={styles.labResultsCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Lab results</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Add Lab Result', 'Add new lab result functionality')}
        >
          <ModernIcon name="plus" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.labResultsList}>
        <View style={styles.labResultItem}>
          <ModernIcon name="file" size={16} color={theme.colors.primary} />
          <Text style={[styles.labResultText, { color: theme.colors.foreground }]}>Blood Test - 10/24/2025</Text>
        </View>
        <View style={styles.labResultItem}>
          <ModernIcon name="file" size={16} color={theme.colors.primary} />
          <Text style={[styles.labResultText, { color: theme.colors.foreground }]}>X-Ray - 10/24/2025</Text>
        </View>
      </View>
    </ModernCard>
  );

  const renderMedicalEventsTimeline = (patient: any) => (
    <ModernCard style={styles.timelineCard}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Medical Events Timeline</Text>
        <TouchableOpacity style={styles.actionButton}>
          <ModernIcon name="more-vertical" size={16} color={theme.colors.foregroundMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.timelineEvent}>
            <Text style={[styles.timelineDate, { color: theme.colors.foregroundMuted }]}>Today</Text>
            <Text style={[styles.timelineEventText, { color: theme.colors.foreground }]}>Patient consultation</Text>
          </View>
        </View>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.timelineEvent}>
            <Text style={[styles.timelineDate, { color: theme.colors.foregroundMuted }]}>Last week</Text>
            <Text style={[styles.timelineEventText, { color: theme.colors.foreground }]}>Blood test completed</Text>
          </View>
        </View>
      </View>
    </ModernCard>
  );

  // Render active section based on sidebar selection
  const renderActiveSection = (patient: any) => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection(patient);
      case 'history':
        return renderHistorySection(patient);
      case 'medications':
        return renderMedicationsSection(patient);
      case 'allergies':
        return renderAllergiesSection(patient);
      case 'results':
        return renderResultsSection(patient);
      case 'vaccines':
        return renderVaccinesSection(patient);
      default:
        return renderOverviewSection(patient);
    }
  };

  // Overview Section (exact layout from image)

  const renderOverviewSection = (patient: any) => (
    <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
      {/* Left Column: Patient Header, Medications, Vitals, Lifestyle, Notes, Lab Results */}
      <View style={{ flex: 2, flexDirection: 'column', gap: 16 }}>
        {/* Top row: Patient Header, Medications, Vitals horizontally */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={[styles.patientHeaderContainer, { flex: 1 }]}>
            {renderPatientHeaderCard(patient)}
          </View>
        </View>
  
        {/* Below vitals aligned with medical history on right, Lifestyle, Notes, Lab Results vertically stacked */}
        <View style={{ flexDirection: 'column', gap: 16 }}>
          <View style={styles.lifestyleContainer}>
            {renderLifestyleCard(patient)}
          </View>
          <View style={styles.labResultsContainer}>
            {renderLabResultsCard(patient)}
          </View>
        </View>
      </View>
  
      {/* Right Column */}
    <View style={{ flex: 1, paddingLeft: 16, justifyContent: 'flex-start'}}>
      {/* Horizontal: Medications and Vitals */}
      <View style={{ flexDirection: 'row', marginBottom: 12/* adjust height to reduce vitals length*/ }}>
        <View style={[styles.medicationsContainer, { flex: 1, marginRight: 8,minHeight: 120,  maxHeight: 140 }]}>
          {renderMedicationsCard(patient)}
        </View>
        <View style={[styles.vitalsContainer, { flex: 1, minHeight: 120, maxHeight: 140 }]}>
          {renderVitalsCard(patient)}
        </View>
      </View>

      {/* Notes below with same width and aligned height as medications */}
      <View style={[styles.notesContainer, {minHeight: 110, marginBottom :12 }]}>
        {renderNotesCard(patient)}
      </View>

      <View>
        {renderMedicalTimelineSection(patient)}
      </View>
    </View>
  </View>
);
  

  // History Section (Medical Events Timeline)
  const renderHistorySection = (patient: any) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Medical History
      </Text>
      {renderMedicalEventsTimeline(patient)}
    </View>
  );

  // Medications Section
  const renderMedicationsSection = (patient: any) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Medications
      </Text>
      <View style={styles.medicationsSection}>
        <ModernCard style={styles.medicationCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Current Medications</Text>
          <Text style={[styles.medicationText, { color: theme.colors.foregroundSecondary }]}>
            {patient.currentMedication || 'No current medications'}
          </Text>
        </ModernCard>
        
        <ModernCard style={styles.medicationCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Past Medications</Text>
          <Text style={[styles.medicationText, { color: theme.colors.foregroundSecondary }]}>
            No past medications recorded
          </Text>
        </ModernCard>
        
        <ModernCard style={styles.medicationCard}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Vaccines</Text>
          <Text style={[styles.medicationText, { color: theme.colors.foregroundSecondary }]}>
            No vaccine records available
          </Text>
        </ModernCard>
      </View>
    </View>
  );

  // Allergies Section
  const renderAllergiesSection = (patient: any) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Allergies
      </Text>
      <ModernCard style={styles.allergiesCard}>
        <Text style={[styles.allergiesText, { color: theme.colors.foregroundSecondary }]}>
          {patient.allergies || 'No known allergies'}
        </Text>
      </ModernCard>
    </View>
  );

  // Results Section (Lab Results)
  const renderResultsSection = (patient: any) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Lab Results
      </Text>
      {renderLabResultsCard(patient)}
    </View>
  );

  // Vaccines Section
  const renderVaccinesSection = (patient: any) => (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Vaccines
      </Text>
      <ModernCard style={styles.vaccinesCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Vaccines</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Add Vaccine', 'Add new vaccine functionality')}
          >
            <ModernIcon name="plus" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.vaccinesList}>
          <View style={styles.vaccineItem}>
            <ModernIcon name="shield" size={16} color={theme.colors.primary} />
            <Text style={[styles.vaccineText, { color: theme.colors.foreground }]}>COVID-19 Vaccine - 12/15/2023</Text>
          </View>
          <View style={styles.vaccineItem}>
            <ModernIcon name="shield" size={16} color={theme.colors.primary} />
            <Text style={[styles.vaccineText, { color: theme.colors.foreground }]}>Flu Vaccine - 10/20/2023</Text>
          </View>
        </View>
      </ModernCard>
    </View>
  );

  // Medical Timeline Section - Last 5 visits
  const renderMedicalTimelineSection = (patient: any) => {
    // Mock data for last 5 visits
    const lastVisits = [
      {
        id: 1,
        date: '2024-01-15',
        doctor: 'Dr. Sarah Johnson',
        reason: 'Follow-up consultation',
        status: 'completed',
        notes: 'Patient showing good progress, continue current medication'
      },
      {
        id: 2,
        date: '2024-01-08',
        doctor: 'Dr. Michael Chen',
        reason: 'Blood pressure check',
        status: 'completed',
        notes: 'BP within normal range, adjust medication dosage'
      },
      {
        id: 3,
        date: '2024-01-02',
        doctor: 'Dr. Sarah Johnson',
        reason: 'Initial consultation',
        status: 'completed',
        notes: 'Patient diagnosed with hypertension, prescribed medication'
      },
      {
        id: 4,
        date: '2023-12-20',
        doctor: 'Dr. Emily Davis',
        reason: 'Annual checkup',
        status: 'completed',
        notes: 'Routine annual examination, all vitals normal'
      },
      {
        id: 5,
        date: '2023-12-10',
        doctor: 'Dr. Michael Chen',
        reason: 'Lab results review',
        status: 'completed',
        notes: 'Lab results reviewed, no concerns identified'
      }
    ];

    return (
      <View style={styles.medicalTimelineSection}>
        <Text style={[styles.timelineSectionTitle, { color: theme.colors.foreground }]}>
          Recent Medical Visits
        </Text>
        <View style={styles.visitsList}>
          {lastVisits.map((visit, index) => (
            <ModernCard key={visit.id} style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <View style={styles.visitDate}>
                  <View style={styles.visitDateRow}>
                    <ModernIcon name="calendar" size={16} color={theme.colors.primary} />
                    <Text style={[styles.visitDateText, { color: theme.colors.foreground }]}>
                      {new Date(visit.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.visitDoctor, { color: theme.colors.foregroundSecondary }]}>
                    {visit.doctor}
                  </Text>
                </View>
                <View style={[styles.visitStatus, { backgroundColor: visit.status === 'completed' ? '#10B981' : '#EF4444' }]}>
                  <Text style={styles.visitStatusText}>
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.visitReason, { color: theme.colors.foreground }]}>
                {visit.reason}
              </Text>
              <Text style={[styles.visitNotes, { color: theme.colors.foregroundSecondary }]}>
                {visit.notes}
              </Text>
            </ModernCard>
          ))}
        </View>
      </View>
    );
  };


  // Notes Popup Component
  const renderNotesPopup = () => (
    <Modal
      visible={showNotesPopup}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNotesPopup(false)}
    >
      <View style={styles.popupOverlay}>
        <View style={[styles.popupContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.popupHeader}>
            <Text style={[styles.popupTitle, { color: theme.colors.foreground }]}>Add Note</Text>
            <TouchableOpacity 
              style={styles.popupCloseButton}
              onPress={() => setShowNotesPopup(false)}
            >
              <ModernIcon name="x" size={20} color={theme.colors.foregroundMuted} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.noteInput, { 
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              color: theme.colors.foreground 
            }]}
            placeholder="Enter your note here..."
            placeholderTextColor={theme.colors.foregroundMuted}
            value={newNote}
            onChangeText={setNewNote}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.popupButtons}>
            <TouchableOpacity 
              style={[styles.popupButton, styles.popupCancelButton]}
              onPress={() => {
                setShowNotesPopup(false);
                setNewNote('');
              }}
            >
              <Text style={styles.popupCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.popupButton, styles.popupSaveButton]}
              onPress={() => {
                // Here you would save the note
                Alert.alert('Note Added', 'Your note has been saved successfully!');
                setShowNotesPopup(false);
                setNewNote('');
              }}
            >
              <Text style={styles.popupSaveText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header with Menu */}
      <View style={[styles.topHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.topHeaderContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <ModernIcon name="x" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.topHeaderTitle, { color: theme.colors.foreground }]}>
            PATIENT OVERVIEW
          </Text>
          <View style={styles.topHeaderActions}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setShowTopMenu(!showTopMenu)}
            >
              <View style={styles.profileAvatar}>
                <ModernIcon name="user" size={16} color={theme.colors.foreground} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Profile Dropdown Menu */}
        {showTopMenu && (
          <View style={[styles.topMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatarSmall}>
                <Text style={styles.profileAvatarSmallText}>
                  {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                </Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: theme.colors.foreground }]}>
                  {patient.firstName} {patient.lastName}
                </Text>
                <Text style={[styles.profileRole, { color: theme.colors.foregroundMuted }]}>
                  {patient.role || 'Doctor'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => { setShowTopMenu(false); }}
            >
              <ModernIcon name="user" size={16} color={theme.colors.foreground} />
              <Text style={[styles.menuItemText, { color: theme.colors.foreground }]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => { navigation.goBack(); setShowTopMenu(false); }}
            >
              <ModernIcon name="log-out" size={16} color={theme.colors.error} />
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.mainContent}>
        {/* Left Sidebar - Premium Neon Design */}
        <View style={[styles.sidebar, { backgroundColor: theme.colors.primary }]}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sidebarGradient}
          >
            <View style={styles.patientProfile}>
              <View style={styles.patientAvatarSidebar}>
                <View style={styles.patientAvatarSidebarBorder}>
                  <Text style={styles.patientAvatarSidebarText}>
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </Text>
                </View>
              </View>
              <Text style={styles.patientNameSidebar}>{patient.firstName} {patient.lastName}</Text>
              <View style={styles.patientIdBadge}>
                <Text style={styles.patientIdSidebar}>ID: {patient.patientId}</Text>
              </View>
            </View>
            
            <View style={styles.sidebarMenu}>
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'overview' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('overview')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'overview' && styles.sidebarMenuItemTextActive]}>
                  OVERVIEW
                </Text>
                {activeSection === 'overview' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'history' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('history')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'history' && styles.sidebarMenuItemTextActive]}>
                  HISTORY
                </Text>
                {activeSection === 'history' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'medications' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('medications')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'medications' && styles.sidebarMenuItemTextActive]}>
                  MEDICATIONS
                </Text>
                {activeSection === 'medications' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'allergies' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('allergies')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'allergies' && styles.sidebarMenuItemTextActive]}>
                  ALLERGIES
                </Text>
                {activeSection === 'allergies' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'results' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('results')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'results' && styles.sidebarMenuItemTextActive]}>
                  RESULTS
                </Text>
                {activeSection === 'results' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sidebarMenuItem, activeSection === 'vaccines' && styles.sidebarMenuItemActive]}
                onPress={() => setActiveSection('vaccines')}
              >
                <Text style={[styles.sidebarMenuItemText, activeSection === 'vaccines' && styles.sidebarMenuItemTextActive]}>
                  VACCINES
                </Text>
                {activeSection === 'vaccines' && <View style={styles.sidebarMenuItemIndicator} />}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {renderActiveSection(patient)}
          </ScrollView>
        </View>
      </View>
      
      {/* Notes Popup */}
      {renderNotesPopup()}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: IS_TABLET ? 24 : 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40, // Same width as close button to center the title
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding:16,
    paddingBottom: 20,
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
    // flex: IS_TABLET ? 0.6 : 1,
    flex: 2,
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
  // New Card-Based Layout Styles
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
    gap: 12,
  },
  rightColumn: {
    flex: 1,
    gap: 12,
  },
  patientHeaderCard: {
    marginBottom: 16,
    padding: 0,
    maxWidth: 520,
    minWidth: 420,
    overflow: 'hidden',
    ...theme.shadows.neon,
  },
  patientHeaderGradient: {
    padding: 32,
    paddingVertical: 28,
  },
  patientHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientProfileSection: {
    flexDirection: 'row',
    flex: 1,
  },
  patientAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  patientAvatarBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.neonGlow,
  },
  patientAvatarText: {
    color: theme.colors.background,
    fontSize: 28,
    fontWeight: '700',
  },
  patientBasicInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  patientConditionBadge: {
    backgroundColor: theme.colors.primaryAlpha,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: 4,
  },
  patientCondition: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  patientDemographics: {
    marginTop: 8,
  },
  demographicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  demographicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demographicLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  demographicValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    width: '100%',
    ...theme.shadows.neon,
  },
  messageButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primaryAlphaDark,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.foreground,
    letterSpacing: -0.3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  contactCard: {
    padding: 16,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  medicationsCard: {
    padding: 20,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  medicationsList: {
    gap: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  medicationText: {
    fontSize: 14,
    flex: 1,
  },
  vitalsCard: {
    padding: 20,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  vitalsGrid: {
    gap: 16,
  },
  vitalsHorizontal: {
    flexDirection: 'row',
    gap: 16,
  },
  vitalItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  vitalItemHorizontal: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.primaryAlpha,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  vitalValueHorizontal: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  vitalLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  vitalLabelHorizontal: {
    fontSize: 12,
    textAlign: 'center',
  },
  notesCard: {
    padding: 20,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  notesContent: {
    gap: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  labResultsCard: {
    padding: 20,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  labResultsList: {
    gap: 8,
  },
  labResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  labResultText: {
    fontSize: 14,
    flex: 1,
  },
  timelineCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  timelineContent: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    borderWidth: 3,
    borderColor: theme.colors.background,
    ...theme.shadows.md,
  },
  timelineEvent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  timelineEventText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  // New Sidebar Navigation Styles
  topHeader: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primaryAlphaDark,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
  topHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: theme.colors.foreground,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 140,
    paddingTop: 20,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  sidebarGradient: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sidebarHeader: {
    marginBottom: 20,
  },
  sidebarToggle: {
    padding: 8,
  },
  patientProfile: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  patientAvatarSidebar: {
    marginBottom: 12,
  },
  patientAvatarSidebarBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.neon,
  },
  patientAvatarSidebarText: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  patientNameSidebar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  patientIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  patientIdSidebar: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  sidebarMenu: {
    gap: 4,
    paddingHorizontal: 8,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
  },
  sidebarMenuItemActive: {
    backgroundColor: '#fff',
    ...theme.shadows.md,
  },
  sidebarMenuItemIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  sidebarMenuItemText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0.5,
    flex: 1,
  },
  sidebarMenuItemTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  medicationsSection: {
    gap: 16,
    paddingHorizontal: 20,
  },
  medicationCard: {
    padding: 16,
  },
  allergiesCard: {
    padding: 16,
    marginHorizontal: 20,
  },
  allergiesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Layout Structure (matching image exactly)
  topRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  patientHeaderContainer: {
    flex: 2, // Increased to accommodate contact info
  },
  contactContainer: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  medicationsContainer: {
    flex: 1,
    marginRight: 8,
    minHeight: 120,
    maxHeight: 140,
  },
  vitalsContainer: {
    flex: 1,
    minHeight: 120,
    maxHeight: 140,
  },
  notesContainer: {
    minHeight: 110,
    marginBottom: 12,
  },
    // (Inside ModernCard or add to specific cards as needed)
  cardHeader: {
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  labResultsContainer: {
    flex: 1,
  },
  medicalTimelineContainer: {
    flex: 1,
  },
  // Medical Timeline Section
  medicalTimelineSection: {
    marginTop: 20,
  },
  timelineSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  visitsList: {
    gap: 12,
    paddingHorizontal: 20,
  },
  visitCard: {
    padding: 16,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitDate: {
    flex: 1,
  },
  visitDateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  visitDoctor: {
    fontSize: 14,
  },
  visitStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visitStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  visitReason: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  visitNotes: {
    fontSize: 14,
    lineHeight: 20,
  },
  visitDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Notes Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  popupCloseButton: {
    padding: 4,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  popupButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  popupCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  popupSaveButton: {
    backgroundColor: '#2DD4BF',
  },
  popupCancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  popupSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Vaccines Styles
  vaccinesCard: {
    padding: 16,
    marginHorizontal: 20,
  },
  vaccinesList: {
    gap: 12,
  },
  vaccineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vaccineText: {
    fontSize: 14,
    flex: 1,
  },
  // Profile Dropdown Styles
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  profileAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileAvatarSmallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
  },
  commonText: {
    fontFamily: 'Roboto', // e.g., 'Roboto', 'System', etc.
    fontSize: 16,                 // Choose an appropriate size
    fontWeight: '400',            // Or 'bold', '500' as needed
    color: theme.colors.foreground  // Optional for consistency
  },
  // Contact info inside profile card
  contactInfoSection: {
    marginTop: 0,
    paddingHorizontal: 0,
    width: '100%',
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    paddingVertical: 4,
  },
  contactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryAlphaDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contactInfoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  
  // Lifestyle card
  lifestyleCard: {
    padding: 16,
    flex: 1,
  },
  lifestyleContainer: {
    flex: 1,
  },
  lifestyleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});

export default PatientDetailsScreen;
