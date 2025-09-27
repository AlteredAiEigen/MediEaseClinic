import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernIcon from '../components/ModernIcon';
import ModernHeader from '../components/ModernHeader';
import Logo from '../components/Logo';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigationWithLoading } from '../hooks/useNavigationWithLoading';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
};

type ClinicalNotesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ClinicalNotes'
>;

interface Props {
  navigation: ClinicalNotesScreenNavigationProp;
  route: { params: { patient: Patient; recordingDuration: number } };
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

interface ClinicalNote {
  id: string;
  type: 'symptom' | 'diagnosis' | 'treatment' | 'followup' | 'vitals';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  actionable: boolean;
  completed?: boolean;
}

const mockClinicalNotes: ClinicalNote[] = [
  {
    id: '1',
    type: 'vitals',
    title: 'Vital Signs Recorded',
    content: 'Blood pressure: 128/82 mmHg, Heart rate: 72 bpm, Temperature: 98.6°F, Oxygen saturation: 98%',
    priority: 'high',
    timestamp: '14:32',
    actionable: false,
  },
  {
    id: '2',
    type: 'symptom',
    title: 'Patient Symptoms',
    content: 'Patient reports intermittent chest pain, shortness of breath after exertion, and occasional dizziness. Pain described as sharp, lasting 5-10 minutes.',
    priority: 'high',
    timestamp: '14:35',
    actionable: true,
  },
  {
    id: '3',
    type: 'diagnosis',
    title: 'Preliminary Diagnosis',
    content: 'Suspected angina pectoris based on symptoms and risk factors. Patient has history of hypertension and family history of heart disease.',
    priority: 'high',
    timestamp: '14:38',
    actionable: true,
  },
  {
    id: '4',
    type: 'treatment',
    title: 'Immediate Treatment Plan',
    content: 'Prescribed nitroglycerin 0.4mg sublingual PRN for chest pain. Advised lifestyle modifications including low-sodium diet and regular exercise.',
    priority: 'high',
    timestamp: '14:42',
    actionable: true,
  },
  {
    id: '5',
    type: 'followup',
    title: 'Follow-up Recommendations',
    content: 'Schedule cardiology consultation within 7 days. Order ECG, echocardiogram, and stress test. Monitor blood pressure daily at home.',
    priority: 'medium',
    timestamp: '14:45',
    actionable: true,
  },
];

const ClinicalNotesScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const { patient, recordingDuration } = route.params;
  const [notes, setNotes] = useState<ClinicalNote[]>(mockClinicalNotes);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNoteTypeConfig = (type: string) => {
    switch (type) {
      case 'vitals':
        return {
          color: theme.colors.medicalPrimary,
          bgColor: 'rgba(174, 234, 214, 0.1)',
          icon: 'pulse',
          label: 'Vitals',
        };
      case 'symptom':
        return {
          color: theme.colors.medicalWarning,
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: 'warning',
          label: 'Symptoms',
        };
      case 'diagnosis':
        return {
          color: theme.colors.medicalError,
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: 'stethoscope',
          label: 'Diagnosis',
        };
      case 'treatment':
        return {
          color: theme.colors.medicalSuccess,
          bgColor: 'rgba(34, 197, 94, 0.1)',
          icon: 'check',
          label: 'Treatment',
        };
      case 'followup':
        return {
          color: theme.colors.info,
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: 'calendar',
          label: 'Follow-up',
        };
      default:
        return {
          color: theme.colors.gray[400],
          bgColor: 'rgba(156, 163, 175, 0.1)',
          icon: 'user',
          label: 'Note',
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          color: theme.colors.medicalError,
          bgColor: 'rgba(239, 68, 68, 0.1)',
          label: 'High Priority',
        };
      case 'medium':
        return {
          color: theme.colors.medicalWarning,
          bgColor: 'rgba(245, 158, 11, 0.1)',
          label: 'Medium Priority',
        };
      case 'low':
        return {
          color: theme.colors.medicalSuccess,
          bgColor: 'rgba(34, 197, 94, 0.1)',
          label: 'Standard',
        };
      default:
        return {
          color: theme.colors.gray[400],
          bgColor: 'rgba(156, 163, 175, 0.1)',
          label: 'Standard',
        };
    }
  };

  const handleMarkComplete = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, completed: true } : note
      )
    );
    Alert.alert('Success', 'Action marked as completed!');
  };

  const handleNewPatient = () => {
    // Create a better styled alert for new patient consultation
    Alert.alert(
      'New Patient Consultation',
      'Ready to start with the next patient?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Continue to Patient Queue',
          style: 'default',
          onPress: () => {
            navigateWithLoading('PatientSelection', undefined, {
              message: 'Preparing patient queue...',
              variant: 'medical',
              delay: 800
            });
          },
        },
      ]
    );
  };

  const renderClinicalNote = (note: ClinicalNote) => {
    const typeConfig = getNoteTypeConfig(note.type);
    const priorityConfig = getPriorityConfig(note.priority);

    return (
      <ModernCard
        key={note.id}
        variant="elevated"
        style={[
          styles.noteCard,
          note.completed && styles.completedNote,
        ]}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTypeContainer}>
            <View style={[styles.noteTypeBadge, { backgroundColor: typeConfig.bgColor }]}>
              <ModernIcon name={typeConfig.icon} size={16} color={typeConfig.color} />
              <Text style={[styles.noteTypeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
            <Text style={[styles.noteTimestamp, { color: theme.colors.foregroundMuted }]}>
              {note.timestamp}
            </Text>
          </View>

          {note.actionable && (
            <View style={[styles.priorityContainer, { backgroundColor: priorityConfig.bgColor }]}>
              <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
                {note.completed ? '✓ COMPLETED' : 'ACTIONABLE'}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.noteTitle, { color: theme.colors.foreground }]}>
          {note.title}
        </Text>

        <Text style={[styles.noteContent, { color: theme.colors.foregroundSecondary }]}>
          {note.content}
        </Text>

        {note.actionable && !note.completed && (
          <View style={styles.actionButtons}>
            <ModernButton
              title="Mark Complete"
              onPress={() => handleMarkComplete(note.id)}
              variant="primary"
              size="sm"
              style={styles.completeButton}
            />
            <ModernButton
              title="Edit Note"
              onPress={() => Alert.alert('Edit', 'Edit functionality coming soon!')}
              variant="outline"
              size="sm"
            />
          </View>
        )}
      </ModernCard>
    );
  };

  const actionableCount = notes.filter(n => n.actionable && !n.completed).length;
  const completedCount = notes.filter(n => n.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ModernHeader
        title="Clinical Notes"
        subtitle={`Generated from ${formatDuration(recordingDuration)} consultation`}
        showBackButton
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          <ModernButton
            title="New Patient"
            onPress={handleNewPatient}
            variant="outline"
            size="sm"
          />
        }
      />

      {/* Patient Summary */}
      <View style={styles.patientSection}>
        <ModernCard variant="elevated" style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Logo width={40} height={40} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                {patient.name}
              </Text>
              <Text style={[styles.patientDetails, { color: theme.colors.foregroundSecondary }]}>
                Age {patient.age} • {patient.condition}
              </Text>
              <Text style={[styles.sessionInfo, { color: theme.colors.foregroundMuted }]}>
                Session Duration: {formatDuration(recordingDuration)}
              </Text>
            </View>
          </View>
        </ModernCard>
      </View>

      {/* Notes Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {notes.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Total Notes
            </Text>
          </ModernCard>

          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.medicalWarning }]}>
              {actionableCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Actionable
            </Text>
          </ModernCard>

          <ModernCard variant="default" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.medicalSuccess }]}>
              {completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundSecondary }]}>
              Completed
            </Text>
          </ModernCard>
        </View>
      </View>

      {/* Notes List */}
      <ScrollView
        style={styles.notesContainer}
        contentContainerStyle={styles.notesContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
          AI-Generated Notes
        </Text>

        {notes.map(renderClinicalNote)}

        {/* AI Processing Summary */}
        <ModernCard variant="gradient" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ModernIcon name="pulse" size={24} color={theme.colors.surface} />
            <Text style={[styles.summaryTitle, { color: theme.colors.surface }]}>
              AI Processing Complete
            </Text>
          </View>

          <View style={styles.summaryContent}>
            <Text style={[styles.summaryText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              ✓ Audio transcription completed successfully{'\n'}
              ✓ {actionableCount} actionable items identified{'\n'}
              ✓ Medical terminology validated{'\n'}
              ✓ Notes structured for EHR integration{'\n'}
              ✓ Ready for physician review
            </Text>
          </View>
        </ModernCard>
      </ScrollView>

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
  patientSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  patientCard: {
    padding: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sessionInfo: {
    fontSize: 12,
    marginTop: 4,
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
  notesContainer: {
    flex: 1,
  },
  notesContent: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  noteCard: {
    marginBottom: 16,
  },
  completedNote: {
    opacity: 0.7,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  noteTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noteTimestamp: {
    fontSize: 14,
  },
  priorityContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    flex: 1,
  },
  summaryCard: {
    marginTop: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryContent: {},
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default ClinicalNotesScreen;
