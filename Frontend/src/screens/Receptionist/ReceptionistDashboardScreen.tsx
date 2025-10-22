import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import { Theme } from '../../themes';
import { useAppContext } from '../../context/AppContext';
import Icon from '../../components/Icon';
import Logo from '../../components/Logo';
import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';
import ModernInput from '../../components/ModernInput';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

type ReceptionistTab = 'queue' | 'appointments' | 'patients' | 'profile';

const ReceptionistDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { currentUser, logout } = useAppContext();

  const [activeTab, setActiveTab] = useState<ReceptionistTab>('queue');

  // Patient registration form
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');

  // Mock patient queue
  const [patientQueue, setPatientQueue] = useState([
    {
      id: '1',
      name: 'John Doe',
      phone: '+1234567890',
      reason: 'Annual checkup',
      doctor: 'Dr. Jane Smith',
      checkedIn: '09:15 AM',
      status: 'waiting',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      phone: '+1234567891',
      reason: 'Follow-up',
      doctor: 'Dr. Jane Smith',
      checkedIn: '09:30 AM',
      status: 'waiting',
    },
  ]);

  const handleCheckIn = () => {
    if (!patientPhone || !patientName) {
      Alert.alert('Missing Info', 'Please enter patient name and phone number');
      return;
    }

    // Mock check-in
    const newPatient = {
      id: Date.now().toString(),
      name: patientName,
      phone: patientPhone,
      reason: 'Consultation',
      doctor: 'Dr. Jane Smith',
      checkedIn: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
    };

    setPatientQueue([...patientQueue, newPatient]);
    setPatientName('');
    setPatientPhone('');
    Alert.alert('Success', `${patientName} checked in successfully`);
  };

  const handleCheckOut = (patientId: string) => {
    Alert.alert(
      'Check Out Patient',
      'Take a photo of the prescription to complete checkout',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: () => {
            setPatientQueue(patientQueue.filter((p) => p.id !== patientId));
            Alert.alert('Success', 'Patient checked out successfully');
          },
        },
      ]
    );
  };

  const renderQueue = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Patient Queue
      </Text>

      {/* Check-in Form */}
    <ModernCard variant="default" style={styles.formCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Check In Patient
        </Text>

      <ModernInput
          label="Phone Number"
        value={patientPhone}
        onChangeText={setPatientPhone}
          placeholder="+1234567890"
        keyboardType="phone-pad"
          leftIcon={<Icon name="phone" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernInput
          label="Patient Name"
          value={patientName}
          onChangeText={setPatientName}
          placeholder="John Doe"
          leftIcon={<Icon name="user" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernButton
          title="Check In"
          variant="gradient"
          size="lg"
          onPress={handleCheckIn}
          leftIcon={<Icon name="check" size={18} color="#fff" />}
        />
      </ModernCard>

      {/* Queue Info */}
      <ModernCard variant="default" style={styles.queueInfoCard}>
        <View style={styles.queueHeader}>
          <Icon name="users" size={32} color={theme.colors.primary} />
          <View style={styles.queueHeaderText}>
            <Text style={[styles.queueCount, { color: theme.colors.foreground }]}>
              {patientQueue.length} Patients
            </Text>
            <Text style={[styles.queueSubtext, { color: theme.colors.foregroundSecondary }]}>
              Currently in clinic
            </Text>
      </View>
      </View>
    </ModernCard>

      {/* Queue List */}
      {patientQueue.length === 0 ? (
        <ModernCard variant="default" style={styles.emptyCard}>
          <Icon name="check-circle" size={48} color={theme.colors.medicalSuccess} />
          <Text style={[styles.emptyText, { color: theme.colors.foreground }]}>
            No patients in queue
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.foregroundSecondary }]}>
            Check in patients as they arrive
          </Text>
        </ModernCard>
      ) : (
        patientQueue.map((patient, index) => (
          <ModernCard key={patient.id} variant="default" style={styles.patientCard}>
            <View style={styles.patientHeader}>
              <View style={styles.queueNumber}>
                <Text style={[styles.queueNumberText, { color: theme.colors.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                  {patient.name}
                </Text>
                <Text style={[styles.patientDetail, { color: theme.colors.foregroundSecondary }]}>
                  {patient.phone}
                </Text>
                <Text style={[styles.patientDetail, { color: theme.colors.foregroundSecondary }]}>
                  Reason: {patient.reason}
                </Text>
                <Text style={[styles.patientDetail, { color: theme.colors.foregroundSecondary }]}>
                  Doctor: {patient.doctor}
              </Text>
                <View style={styles.timeContainer}>
                  <Icon name="clock" size={14} color={theme.colors.foregroundMuted} />
                  <Text style={[styles.timeText, { color: theme.colors.foregroundMuted }]}>
                    Checked in: {patient.checkedIn}
              </Text>
                </View>
              </View>
            </View>
            <View style={styles.patientActions}>
              <ModernButton
                title="Check Out"
                variant="primary"
                size="md"
                onPress={() => handleCheckOut(patient.id)}
                leftIcon={<Icon name="camera" size={16} color="#fff" />}
              />
            </View>
          </ModernCard>
        ))
      )}
    </View>
  );

  const renderAppointments = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Appointments
      </Text>

      <ModernCard variant="default" style={styles.formCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Schedule New Appointment
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary }]}>
          Book appointments with real-time doctor availability
        </Text>
        <ModernButton
          title="New Appointment"
          variant="gradient"
          size="lg"
          onPress={() => Alert.alert('Coming Soon', 'Appointment scheduling will be available soon')}
          leftIcon={<Icon name="calendar" size={18} color="#fff" />}
        />
      </ModernCard>

      <ModernCard variant="default" style={styles.infoCard}>
        <Icon name="calendar" size={48} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Appointment Management
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary, textAlign: 'center' }]}>
          View and manage appointments with doctor availability tracking
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundMuted, fontSize: 12 }]}>
          Full appointment system coming soon...
        </Text>
      </ModernCard>
    </View>
  );

  const renderPatients = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        Patient Records
      </Text>

      <ModernCard variant="default" style={styles.formCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Register New Patient
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary }]}>
          Add new patients with automatic duplicate detection
        </Text>
        <ModernButton
          title="Register Patient"
          variant="gradient"
          size="lg"
          onPress={() => Alert.alert('Coming Soon', 'Patient registration will be available soon')}
          leftIcon={<Icon name="plus" size={18} color="#fff" />}
        />
      </ModernCard>

      <ModernCard variant="default" style={styles.searchCard}>
        <Icon name="search" size={24} color={theme.colors.foregroundMuted} />
        <Text style={[styles.searchPlaceholder, { color: theme.colors.foregroundMuted }]}>
          Search patients by name or phone number
        </Text>
      </ModernCard>

      <ModernCard variant="default" style={styles.infoCard}>
        <Icon name="file-text" size={48} color={theme.colors.primary} />
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Patient Management
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundSecondary, textAlign: 'center' }]}>
          Register new patients and update existing patient information
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.foregroundMuted, fontSize: 12 }]}>
          Full patient management system coming soon...
        </Text>
      </ModernCard>
    </View>
  );

  const renderProfile = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
        My Profile
      </Text>

      <ModernCard variant="default" style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Icon name="user" size={48} color={theme.colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.foreground }]}>
              {currentUser?.name || 'Receptionist Name'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.colors.foregroundSecondary }]}>
              {currentUser?.email || 'reception@clinic.com'}
            </Text>
            <View style={styles.roleTag}>
              <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                Receptionist
              </Text>
            </View>
          </View>
        </View>
      </ModernCard>

      <ModernCard variant="default" style={styles.statsCard}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>
          Today's Activity
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {patientQueue.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Patients Checked In
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Appointments
            </Text>
          </View>
        </View>
    </ModernCard>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'queue':
        return renderQueue();
      case 'appointments':
        return renderAppointments();
      case 'patients':
        return renderPatients();
      case 'profile':
        return renderProfile();
      default:
        return renderQueue();
    }
  };

  const tabs: { key: ReceptionistTab; label: string; icon: string }[] = [
    { key: 'queue', label: 'Queue', icon: 'users' },
    { key: 'appointments', label: 'Appointments', icon: 'calendar' },
    { key: 'patients', label: 'Patients', icon: 'file-text' },
    { key: 'profile', label: 'Profile', icon: 'user' },
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
                Receptionist Dashboard
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.foregroundSecondary }]}>
                {currentUser?.name || 'Receptionist'}
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
  formCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  infoText: {
    fontSize: IS_TABLET ? 16 : 14,
    lineHeight: 22,
  },
  queueInfoCard: {
    padding: IS_TABLET ? 24 : 20,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  queueHeaderText: {
    flex: 1,
  },
  queueCount: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '700',
  },
  queueSubtext: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  emptyCard: {
    padding: IS_TABLET ? 48 : 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  patientCard: {
    padding: IS_TABLET ? 20 : 16,
    gap: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  queueNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueNumberText: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  patientDetail: {
    fontSize: IS_TABLET ? 14 : 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeText: {
    fontSize: IS_TABLET ? 12 : 11,
  },
  patientActions: {
    flexDirection: 'row',
    gap: 12,
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
  infoCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 12,
    alignItems: 'center',
  },
  profileCard: {
    padding: IS_TABLET ? 24 : 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    fontSize: IS_TABLET ? 24 : 20,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: IS_TABLET ? 16 : 14,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
  },
  roleText: {
    fontSize: IS_TABLET ? 14 : 12,
    fontWeight: '600',
  },
  statsCard: {
    padding: IS_TABLET ? 24 : 20,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
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
  statValue: {
    fontSize: IS_TABLET ? 32 : 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: IS_TABLET ? 14 : 12,
    textAlign: 'center',
  },
});

export default ReceptionistDashboardScreen;
