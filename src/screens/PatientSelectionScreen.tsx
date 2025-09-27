import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernIcon from '../components/ModernIcon';
import ModernHeader from '../components/ModernHeader';
import Logo from '../components/Logo';
import HamburgerMenu from '../components/HamburgerMenu';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigationWithLoading } from '../hooks/useNavigationWithLoading';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
};

type PatientSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PatientSelection'
>;

interface Props {
  navigation: PatientSelectionScreenNavigationProp;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high';
  waitTime: string;
  appointmentTime: string;
  avatar?: string;
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 34,
    condition: 'Routine Checkup',
    priority: 'low',
    waitTime: '5 min',
    appointmentTime: '09:00 AM',
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 45,
    condition: 'Hypertension Follow-up',
    priority: 'medium',
    waitTime: '15 min',
    appointmentTime: '09:30 AM',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    age: 28,
    condition: 'Pregnancy Consultation',
    priority: 'high',
    waitTime: '2 min',
    appointmentTime: '10:00 AM',
  },
  {
    id: '4',
    name: 'David Thompson',
    age: 62,
    condition: 'Diabetes Management',
    priority: 'medium',
    waitTime: '25 min',
    appointmentTime: '10:30 AM',
  },
  {
    id: '5',
    name: 'Lisa Park',
    age: 39,
    condition: 'Annual Physical',
    priority: 'low',
    waitTime: '35 min',
    appointmentTime: '11:00 AM',
  },
];

const { width, height } = Dimensions.get('window');

const PatientSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: theme.colors.medicalError,
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: 'warning',
          label: 'High Priority',
        };
      case 'medium':
        return {
          color: theme.colors.medicalWarning,
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: 'clock',
          label: 'Medium Priority',
        };
      case 'low':
        return {
          color: theme.colors.medicalSuccess,
          bgColor: 'rgba(34, 197, 94, 0.1)',
          icon: 'check',
          label: 'Standard',
        };
      default:
        return {
          color: theme.colors.gray[400],
          bgColor: 'rgba(156, 163, 175, 0.1)',
          icon: 'user',
          label: 'Standard',
        };
    }
  };

  // Custom styled alert dialog for patient selection
  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Create a modal-like overlay with better styling
    const CustomAlert = () => {
      return (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => {}}
          />
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <ModernIcon name="user-plus" size={24} color="#fff" />
              <Text style={styles.modalTitle}>Confirm Patient Selection</Text>
            </LinearGradient>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Ready to start consultation with <Text style={styles.modalHighlight}>{patient.name}</Text>?
              </Text>
              
              <View style={styles.modalPatientInfo}>
                <View style={styles.modalPatientDetail}>
                  <ModernIcon name="activity" size={16} color={theme.colors.foregroundMuted} />
                  <Text style={styles.modalPatientDetailText}>{patient.condition}</Text>
                </View>
                <View style={styles.modalPatientDetail}>
                  <ModernIcon name="clock" size={16} color={theme.colors.foregroundMuted} />
                  <Text style={styles.modalPatientDetailText}>Appointment: {patient.appointmentTime}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  // Close modal logic here
                  setSelectedPatient(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={() => {
                  navigateWithLoading('Recording', { patient }, {
                    message: `Preparing consultation for ${patient.name}...`,
                    variant: 'medical',
                    delay: 1000
                  });
                }}
              >
                <Text style={styles.modalConfirmButtonText}>Start Recording</Text>
                <ModernIcon name="mic" size={16} color="#fff" style={{marginLeft: 8}} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };
    
    // For simplicity, we'll still use Alert.alert but with better styling in the RecordingScreen
    Alert.alert(
      'Confirm Patient Selection',
      `Ready to start consultation with ${patient.name}?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setSelectedPatient(null)
        },
        {
          text: 'Start Recording',
          style: 'default',
          onPress: () => {
            navigateWithLoading('Recording', { patient }, {
              message: `Preparing consultation for ${patient.name}...`,
              variant: 'medical',
              delay: 1000
            });
          },
        },
      ]
    );
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const priorityConfig = getPriorityConfig(item.priority);
    const isSelected = selectedPatient?.id === item.id;

    return (
      <ModernCard
        variant={isSelected ? "elevated" : "default"}
        style={{
          ...styles.patientCard,
          ...(isSelected ? {
            borderColor: theme.colors.primary,
            borderWidth: 2,
          } : {}),
        }}
      >
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <ModernIcon name="user" size={32} color={theme.colors.primary} />
          </View>

          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[styles.patientDetails, { color: theme.colors.foregroundSecondary }]}>
              Age {item.age} • {item.condition}
            </Text>
          </View>

          <View style={[styles.priorityContainer, { backgroundColor: priorityConfig.bgColor }]}>
            <ModernIcon name={priorityConfig.icon} size={16} color={priorityConfig.color} />
            <Text style={[styles.priorityLabel, { color: priorityConfig.color }]}>
              {priorityConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.patientMetrics}>
          <View style={styles.metric}>
            <ModernIcon name="clock" size={16} color={theme.colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: theme.colors.foregroundMuted }]}>
              Wait: {item.waitTime}
            </Text>
          </View>

          <View style={styles.metric}>
            <ModernIcon name="calendar" size={16} color={theme.colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: theme.colors.foregroundMuted }]}>
              {item.appointmentTime}
            </Text>
          </View>
        </View>

        <View style={styles.patientActions}>
          <ModernButton
            title="Select Patient"
            onPress={() => handlePatientSelect(item)}
            variant={isSelected ? "gradient" : "primary"}
            size="sm"
            style={styles.selectButton}
          />
        </View>
      </ModernCard>
    );
  };

  // Filter patients based on priority and search query
  const filteredPatients = useMemo(() => {
    return mockPatients.filter(patient => {
      // Apply priority filter if set
      if (priorityFilter && patient.priority !== priorityFilter) {
        return false;
      }
      
      // Apply search filter if query exists
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          patient.name.toLowerCase().includes(query) || 
          patient.condition.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [mockPatients, priorityFilter, searchQuery]);
  
  // Get next patient (highest priority or first in queue)
  const nextPatient = useMemo(() => {
    // First try to find high priority patients
    const highPriorityPatient = mockPatients.find(p => p.priority === 'high');
    if (highPriorityPatient) return highPriorityPatient;
    
    // Then medium priority
    const mediumPriorityPatient = mockPatients.find(p => p.priority === 'medium');
    if (mediumPriorityPatient) return mediumPriorityPatient;
    
    // Fall back to first patient in queue
    return mockPatients[0];
  }, [mockPatients]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Patient Queue"
        subtitle={`${mockPatients.length} patients waiting`}
        leftIcon={<ModernIcon name="menu" size={20} color={theme.colors.foreground} />}
        onLeftPress={() => setMenuVisible(true)}
        rightIcon={<ModernIcon name="settings" size={20} color={theme.colors.foreground} />}
      />

      {/* Next Patient Highlight - Enhanced for better visibility */}
      {nextPatient && (
        <View style={styles.nextPatientSection}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextPatientCard}
          >
            <View style={styles.nextPatientContent}>
              <View style={styles.nextPatientInfo}>
                <View style={styles.nextPatientHeader}>
                  <View style={styles.nextPatientIconContainer}>
                    <ModernIcon name="user-plus" size={24} color={theme.colors.surface} />
                  </View>
                  <View>
                    <Text style={styles.nextPatientLabel}>NEXT PATIENT</Text>
                    <Text style={styles.nextPatientName}>{nextPatient.name}</Text>
                  </View>
                </View>
                
                <View style={styles.nextPatientDetails}>
                  <View style={styles.nextPatientDetail}>
                    <ModernIcon name="user" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.nextPatientDetailText}>Age {nextPatient.age}</Text>
                  </View>
                  <View style={styles.nextPatientDetail}>
                    <ModernIcon name="activity" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.nextPatientDetailText}>{nextPatient.condition}</Text>
                  </View>
                  <View style={styles.nextPatientDetail}>
                    <ModernIcon name="clock" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.nextPatientDetailText}>Wait: {nextPatient.waitTime}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.nextPatientAction}>
                <TouchableOpacity 
                  style={styles.nextPatientButton}
                  onPress={() => handlePatientSelect(nextPatient)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextPatientButtonText}>Start Consultation</Text>
                  <ModernIcon name="arrow-right" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Filter Controls */}
      <View style={styles.filterSection}>
        <Text style={[styles.queueTitle, { color: theme.colors.foreground }]}>
          Patient Queue
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              priorityFilter === null && styles.filterChipActive,
              priorityFilter === null && { backgroundColor: theme.colors.primary + '20' }
            ]}
            onPress={() => setPriorityFilter(null)}
          >
            <Text style={[
              styles.filterChipText,
              priorityFilter === null && { color: theme.colors.primary }
            ]}>
              All ({mockPatients.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              priorityFilter === 'high' && styles.filterChipActive,
              priorityFilter === 'high' && { backgroundColor: theme.colors.medicalError + '20' }
            ]}
            onPress={() => setPriorityFilter('high')}
          >
            <ModernIcon 
              name="warning" 
              size={16} 
              color={priorityFilter === 'high' ? theme.colors.medicalError : theme.colors.foregroundSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              priorityFilter === 'high' && { color: theme.colors.medicalError }
            ]}>
              High Priority ({mockPatients.filter(p => p.priority === 'high').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              priorityFilter === 'medium' && styles.filterChipActive,
              priorityFilter === 'medium' && { backgroundColor: theme.colors.medicalWarning + '20' }
            ]}
            onPress={() => setPriorityFilter('medium')}
          >
            <ModernIcon 
              name="clock" 
              size={16} 
              color={priorityFilter === 'medium' ? theme.colors.medicalWarning : theme.colors.foregroundSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              priorityFilter === 'medium' && { color: theme.colors.medicalWarning }
            ]}>
              Medium Priority ({mockPatients.filter(p => p.priority === 'medium').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterChip,
              priorityFilter === 'low' && styles.filterChipActive,
              priorityFilter === 'low' && { backgroundColor: theme.colors.medicalSuccess + '20' }
            ]}
            onPress={() => setPriorityFilter('low')}
          >
            <ModernIcon 
              name="check" 
              size={16} 
              color={priorityFilter === 'low' ? theme.colors.medicalSuccess : theme.colors.foregroundSecondary} 
            />
            <Text style={[
              styles.filterChipText,
              priorityFilter === 'low' && { color: theme.colors.medicalSuccess }
            ]}>
              Standard ({mockPatients.filter(p => p.priority === 'low').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content - Patient List */}
      <View style={styles.mainContentContainer}>
        {/* Patient Queue - Expanded for tablet */}
        <View style={styles.queueSection}>
          <FlatList
            data={filteredPatients}
            renderItem={renderPatientCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <ModernIcon name="search" size={48} color={theme.colors.foregroundMuted} />
                <Text style={styles.emptyListText}>No patients match your filter criteria</Text>
                <ModernButton 
                  title="Clear Filters" 
                  onPress={() => setPriorityFilter(null)} 
                  variant="outline"
                  size="sm"
                  style={{marginTop: 16}}
                />
              </View>
            }
          />
        </View>
        
        {/* Stats Panel - Now on the side for tablet */}
        <View style={styles.statsPanelContainer}>
          <ModernCard variant="default" style={styles.statsPanel}>
            <Text style={styles.statsPanelTitle}>Queue Summary</Text>
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <ModernIcon name="users" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Patients</Text>
                <Text style={styles.statValue}>{mockPatients.length}</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, {backgroundColor: theme.colors.medicalError + '20'}]}>
                <ModernIcon name="warning" size={20} color={theme.colors.medicalError} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>High Priority</Text>
                <Text style={[styles.statValue, {color: theme.colors.medicalError}]}>
                  {mockPatients.filter(p => p.priority === 'high').length}
                </Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, {backgroundColor: theme.colors.medicalWarning + '20'}]}>
                <ModernIcon name="clock" size={20} color={theme.colors.medicalWarning} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Medium Priority</Text>
                <Text style={[styles.statValue, {color: theme.colors.medicalWarning}]}>
                  {mockPatients.filter(p => p.priority === 'medium').length}
                </Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, {backgroundColor: theme.colors.medicalSuccess + '20'}]}>
                <ModernIcon name="check" size={20} color={theme.colors.medicalSuccess} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Standard</Text>
                <Text style={[styles.statValue, {color: theme.colors.medicalSuccess}]}>
                  {mockPatients.filter(p => p.priority === 'low').length}
                </Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, {backgroundColor: theme.colors.foregroundMuted + '20'}]}>
                <ModernIcon name="clock" size={20} color={theme.colors.foregroundMuted} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Average Wait Time</Text>
                <Text style={styles.statValue}>15 min</Text>
              </View>
            </View>
          </ModernCard>
        </View>
      </View>

      <HamburgerMenu
        isVisible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />

      <LoadingScreen
        visible={isLoading}
        message={loadingMessage}
        variant={loadingVariant}
        showProgress={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Custom Alert Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  modalBody: {
    padding: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  modalHighlight: {
    fontWeight: '700',
    color: '#2DD4BF',
  },
  modalPatientInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  modalPatientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPatientDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#2DD4BF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Next Patient Section - Enhanced for visibility
  nextPatientSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  nextPatientCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextPatientContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPatientInfo: {
    flex: 1,
  },
  nextPatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextPatientIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextPatientLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextPatientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  nextPatientDetails: {
    marginTop: 8,
  },
  nextPatientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextPatientDetailText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  nextPatientAction: {
    marginLeft: 20,
  },
  nextPatientButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextPatientButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2DD4BF',
    marginRight: 8,
  },
  
  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  filterChipActive: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  
  // Main Content Container - For tablet layout
  mainContentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Queue Section - Now part of main content
  queueSection: {
    flex: 3,
    paddingHorizontal: 20,
  },
  queueTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  
  // Patient Card
  patientCard: {
    padding: 0,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(174, 234, 214, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  patientMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    marginLeft: 6,
  },
  patientActions: {
    padding: 16,
    paddingTop: 0,
  },
  selectButton: {
    width: '100%',
  },
  
  // Stats Panel - Now on the side for tablet
  statsPanelContainer: {
    width: 280,
    padding: 20,
    paddingLeft: 0,
  },
  statsPanel: {
    padding: 20,
    height: '100%',
  },
  statsPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default PatientSelectionScreen;
