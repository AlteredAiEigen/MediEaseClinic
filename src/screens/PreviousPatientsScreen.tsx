import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernIcon from '../components/ModernIcon';
import ModernHeader from '../components/ModernHeader';
import Logo from '../components/Logo';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
  PreviousPatients: undefined;
};

type PreviousPatientsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PreviousPatients'
>;

interface Props {
  navigation: PreviousPatientsScreenNavigationProp;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high';
  waitTime: string;
  appointmentTime: string;
}

interface CompletedConsultation {
  id: string;
  patient: Patient;
  consultationDate: string;
  duration: string;
  notesCount: number;
  status: 'completed' | 'reviewed';
  summary: string;
  followUpDate?: string;
}

const mockCompletedConsultations: CompletedConsultation[] = [
  {
    id: '1',
    patient: {
      id: 'p1',
      name: 'Sarah Johnson',
      age: 34,
      condition: 'Routine Checkup',
      priority: 'low',
      waitTime: '5 min',
      appointmentTime: '09:00 AM',
    },
    consultationDate: '2024-09-27',
    duration: '12:35',
    notesCount: 5,
    status: 'completed',
    summary: 'Routine annual physical - all vitals normal, recommended lifestyle modifications',
    followUpDate: '2025-09-27',
  },
  {
    id: '2',
    patient: {
      id: 'p2',
      name: 'Michael Chen',
      age: 45,
      condition: 'Hypertension Follow-up',
      priority: 'medium',
      waitTime: '15 min',
      appointmentTime: '09:30 AM',
    },
    consultationDate: '2024-09-27',
    duration: '18:42',
    notesCount: 7,
    status: 'reviewed',
    summary: 'Blood pressure controlled with medication, diet counseling provided',
  },
  {
    id: '3',
    patient: {
      id: 'p3',
      name: 'Emily Rodriguez',
      age: 28,
      condition: 'Pregnancy Consultation',
      priority: 'high',
      waitTime: '2 min',
      appointmentTime: '10:00 AM',
    },
    consultationDate: '2024-09-26',
    duration: '25:18',
    notesCount: 12,
    status: 'completed',
    summary: 'First trimester pregnancy, prenatal care initiated, vitamin supplements prescribed',
    followUpDate: '2024-10-10',
  },
  {
    id: '4',
    patient: {
      id: 'p4',
      name: 'David Thompson',
      age: 62,
      condition: 'Diabetes Management',
      priority: 'medium',
      waitTime: '25 min',
      appointmentTime: '10:30 AM',
    },
    consultationDate: '2024-09-26',
    duration: '22:15',
    notesCount: 9,
    status: 'reviewed',
    summary: 'HbA1c improved, insulin dosage adjusted, nutrition education provided',
  },
  {
    id: '5',
    patient: {
      id: 'p5',
      name: 'Lisa Park',
      age: 39,
      condition: 'Annual Physical',
      priority: 'low',
      waitTime: '35 min',
      appointmentTime: '11:00 AM',
    },
    consultationDate: '2024-09-25',
    duration: '15:28',
    notesCount: 6,
    status: 'completed',
    summary: 'Comprehensive annual exam completed, minor vitamin deficiencies addressed',
    followUpDate: '2025-09-25',
  },
];

const PreviousPatientsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [consultations] = useState<CompletedConsultation[]>(mockCompletedConsultations);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: theme.colors.medicalSuccess,
          bgColor: 'rgba(34, 197, 94, 0.1)',
          label: 'Completed',
        };
      case 'reviewed':
        return {
          color: theme.colors.info,
          bgColor: 'rgba(59, 130, 246, 0.1)',
          label: 'Reviewed',
        };
      default:
        return {
          color: theme.colors.foregroundMuted,
          bgColor: 'rgba(156, 163, 175, 0.1)',
          label: 'Unknown',
        };
    }
  };

  const renderConsultationCard = ({ item }: { item: CompletedConsultation }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <ModernCard variant="elevated" style={styles.consultationCard}>
        <View style={styles.consultationHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.patientAvatar}>
              <Logo width={32} height={32} />
            </View>
            <View style={styles.patientDetails}>
              <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                {item.patient.name}
              </Text>
              <Text style={[styles.patientMeta, { color: theme.colors.foregroundSecondary }]}>
                Age {item.patient.age} • {formatDate(item.consultationDate)}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.consultationContent}>
          <Text style={[styles.condition, { color: theme.colors.foreground }]}>
            {item.patient.condition}
          </Text>
          <Text style={[styles.summary, { color: theme.colors.foregroundSecondary }]}>
            {item.summary}
          </Text>
        </View>

        <View style={styles.consultationMetrics}>
          <View style={styles.metric}>
            <ModernIcon name="clock" size={16} color={theme.colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: theme.colors.foregroundMuted }]}>
              {item.duration}
            </Text>
          </View>

          <View style={styles.metric}>
            <ModernIcon name="stethoscope" size={16} color={theme.colors.foregroundMuted} />
            <Text style={[styles.metricText, { color: theme.colors.foregroundMuted }]}>
              {item.notesCount} notes
            </Text>
          </View>

          {item.followUpDate && (
            <View style={styles.metric}>
              <ModernIcon name="calendar" size={16} color={theme.colors.primary} />
              <Text style={[styles.metricText, { color: theme.colors.primary }]}>
                Follow-up: {formatDate(item.followUpDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.consultationActions}>
          <ModernButton
            title="View Details"
            onPress={() => navigation.navigate('ClinicalNotes', {
              patient: item.patient,
              recordingDuration: parseInt(item.duration.replace(':', ''), 10)
            })}
            variant="outline"
            size="sm"
            style={styles.viewButton}
          />
          <ModernButton
            title="Print Report"
            onPress={() => alert('Print functionality coming soon!')}
            variant="ghost"
            size="sm"
          />
        </View>
      </ModernCard>
    );
  };

  const getStats = () => {
    const today = consultations.filter(c => formatDate(c.consultationDate) === 'Today').length;
    const thisWeek = consultations.filter(c => {
      const date = new Date(c.consultationDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    const pendingFollowUps = consultations.filter(c => c.followUpDate).length;

    return { today, thisWeek, pendingFollowUps };
  };

  const stats = getStats();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Previous Patients"
        subtitle={`${consultations.length} completed consultations`}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {stats.today}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Today
            </Text>
          </ModernCard>

          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.medicalSuccess }]}>
              {stats.thisWeek}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              This Week
            </Text>
          </ModernCard>

          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.medicalWarning }]}>
              {stats.pendingFollowUps}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Follow-ups
            </Text>
          </ModernCard>
        </View>
      </View>

      {/* Consultations List */}
      <View style={styles.listSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          Recent Consultations
        </Text>

        <FlatList
          data={consultations}
          renderItem={renderConsultationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 16,
  },
  consultationCard: {
    padding: 0,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  patientAvatar: {
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  consultationContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  condition: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  consultationMetrics: {
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
  consultationActions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  viewButton: {
    flex: 1,
  },
});

export default PreviousPatientsScreen;
