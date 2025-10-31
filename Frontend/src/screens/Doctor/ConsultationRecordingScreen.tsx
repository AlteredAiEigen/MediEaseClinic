import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RequestPermissionsScreen from './RequestPermissionsScreen';
import { useTheme } from '../../themes/ThemeContext';
import { Theme } from '../../themes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import RecordingService from '../../services/RecordingService';
import ExternalMicService from '../../services/ExternalMicService';
import { useAppointments } from '../../context/AppointmentsContext';
import { useAppContext } from '../../context/AppContext';

import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import ModernHeader from '../../components/ModernHeader';
import Logo from '../../components/Logo';
import LoadingScreen from '../../components/LoadingScreen';
import { useNavigationWithLoading } from '../../hooks/useNavigationWithLoading';

type RootStackParamList = {
  DoctorDashboard: undefined;
  ConsultationRecording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number; recordingId: string };
};

type ConsultationRecordingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConsultationRecording'
>;

interface Props {
  navigation: ConsultationRecordingScreenNavigationProp;
  route: { params: { patient: Patient } };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  medicalHistory?: string;
  [key: string]: any;
}

const { width } = Dimensions.get('window');
const IS_TABLET = width >= 768;

const ConsultationRecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const { updateAppointmentStatus } = useAppointments();
  const { currentUser } = useAppContext();
  const { patient } = route.params;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingSession, setRecordingSession] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [micStatus, setMicStatus] = useState('Checking microphone...');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const androidApiLevel = React.useMemo(() => {
    if (Platform.OS !== 'android') {
      return null;
    }

    if (typeof Platform.Version === 'string') {
      const parsed = parseInt(Platform.Version, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return Platform.Version as number;
  }, []);

  const requiresLegacyStoragePermission = Platform.OS === 'android' && (androidApiLevel ?? 0) < 29;
  
  // Check if permissions were already granted on component mount
  useEffect(() => {
    const checkActualPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          // Check the actual system permissions
          const micPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          let storagePermissionGranted = true;

          if (requiresLegacyStoragePermission) {
            storagePermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          }
          
          if (micPermission && storagePermissionGranted) {
            console.log('System permissions are already granted');
            setPermissionsGranted(true);
            // Update storage to match actual permissions
            await AsyncStorage.setItem('permissionsGranted', 'true');
            return;
          }
        } else {
          // iOS doesn't need runtime permissions for this app
          setPermissionsGranted(true);
          return;
        }
        
        // If system permissions not granted, check stored value as fallback
        const storedPermissions = await AsyncStorage.getItem('permissionsGranted');
        if (storedPermissions === 'true') {
          setPermissionsGranted(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    
    checkActualPermissions();
  }, [requiresLegacyStoragePermission]);

  // Animation values
  const [waveAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [scaleAnimation] = useState(new Animated.Value(1));

  // Duration timer
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check microphone status on mount
  useEffect(() => {
    const checkMicrophoneStatus = async () => {
      try {
        setMicStatus('Checking microphone connection...');
        
        try {
          // Try to get device info
          const deviceInfo = await ExternalMicService.listAudioDevices();
          
          if (deviceInfo.hasExternalMic) {
            // Found external microphone
            const externalDevices = deviceInfo.devices?.filter(d => d.isExternal) || [];
            
            if (externalDevices.length > 0) {
              const deviceNames = externalDevices.map(d => d.name).join(', ');
              setMicStatus(`External microphone detected: ${deviceNames}`);
            } else {
              setMicStatus('External microphone connected via OTG');
            }
            setRecordingError(null);
          } else {
            // No external microphone found
            setMicStatus('No external microphone detected');
            setRecordingError('No external microphone found. Please connect a microphone via OTG.');
          }
          
          // Log all devices for debugging
          if (deviceInfo.devices && deviceInfo.devices.length > 0) {
            console.log('Available audio devices:');
            deviceInfo.devices.forEach(device => {
              console.log(`- ${device.name} (${device.type}), External: ${device.isExternal}`);
            });
          } else {
            console.log('No audio devices found');
          }
        } catch (err) {
          console.error('Error checking microphone:', err);
          setMicStatus('Error detecting external microphone');
          setRecordingError('Could not detect external microphone. Please check connection.');
        }
      } catch (err) {
        console.error('Unexpected error while checking microphone:', err);
        setMicStatus('Microphone service unavailable');
        setRecordingError('Microphone service unavailable on this device');
      }
    };
    
    checkMicrophoneStatus();
  }, []);

  // Audio level polling
  useEffect(() => {
    let audioLevelInterval: NodeJS.Timeout | null = null;

    if (isRecording) {
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start audio level polling
      audioLevelInterval = setInterval(() => {
        const level = RecordingService.getAudioLevel();
        setAudioLevel(level);
      }, 100);

      // Start animations
      startAnimations();
    } else {
      // Clear timers and reset animations
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      if (audioLevelInterval) {
        clearInterval(audioLevelInterval);
      }

      resetAnimations();
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (audioLevelInterval) {
        clearInterval(audioLevelInterval);
      }
    };
  }, [isRecording]);

  // Start animations for recording state
  const startAnimations = () => {
    // Wave animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Reset animations
  const resetAnimations = () => {
    waveAnimation.setValue(0);
    pulseAnimation.setValue(1);
    scaleAnimation.setValue(1);
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    return RecordingService.formatDuration(seconds);
  };

  // Show toast message
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    } else {
      // For iOS, use Alert with auto-dismiss
      Alert.alert(
        'Recording',
        message,
        [],
        { cancelable: true }
      );
    }
  };

  // Handle start/stop recording
  const handleStartStopRecording = async () => {
    // Clear previous errors
    setRecordingError(null);
    
    try {
      if (!isRecording) {
        // Update status
        setMicStatus('Initializing microphone...');
        
        try {
          // Start recording
          const session = await RecordingService.startRecording(
            patient.id,
            'apt_' + Date.now(), // Mock appointment ID
            currentUser?.id || 'unknown_doctor'
          );
          
          setRecordingSession(session);
          setIsRecording(true);
          setRecordingComplete(false);
          setMicStatus('Recording in progress - External microphone active');
          showToast('Recording started');
        } catch (err) {
          console.error('Failed to start recording:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setRecordingError(`Failed to start recording: ${errorMessage}`);
          setMicStatus('Error with microphone');
          Alert.alert('Recording Error', `Failed to start recording: ${errorMessage}`);
        }
      } else {
        // Stop recording
        if (recordingSession) {
          try {
            setMicStatus('Finalizing recording...');
            const recording = await RecordingService.stopRecording();
            
            if (recording && recording.filePath) {
              setIsRecording(false);
              setRecordingSession(null);
              setRecordingId(recording.id);
              setRecordingComplete(true);
              setMicStatus('Recording completed successfully');
              
              const savedMessage = `Recording saved - ${formatDuration(recordingDuration)}`;
              showToast(savedMessage);
            } else {
              throw new Error('Recording has no file path');
            }
          } catch (err) {
            console.error('Failed to stop recording:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setRecordingError(`Failed to save recording: ${errorMessage}`);
            setMicStatus('Error saving recording');
            setIsRecording(false);
            setRecordingSession(null);
            Alert.alert('Recording Error', `Failed to save recording: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRecordingError(`Recording error: ${errorMessage}`);
      setMicStatus('Recording system error');
      Alert.alert('Recording System Error', errorMessage);
      console.error('Recording system error:', error);
    }
  };

  // Handle play recording
  const handlePlayRecording = async () => {
    if (!recordingId) {
      Alert.alert('Error', 'No recording available to play');
      return;
    }

    try {
      setPlayingAudio(true);
      const success = await RecordingService.playRecording(recordingId);
      
      if (!success) {
        Alert.alert('Playback Error', 'Failed to play the recording');
      }
      
      // Simulate playback duration for demo purposes
      setTimeout(() => {
        setPlayingAudio(false);
      }, recordingDuration * 1000);
    } catch (error) {
      setPlayingAudio(false);
      Alert.alert('Playback Error', 'Failed to play the recording');
      console.error('Playback error:', error);
    }
  };

  // Navigate to clinical notes
  const handleContinueToClinicalNotes = () => {
    if (!recordingId) {
      Alert.alert('Error', 'No recording available');
      return;
    }

    navigateWithLoading(
      'ClinicalNotes', 
      { 
        patient, 
        recordingDuration,
        recordingId 
      }, 
      'Processing recording...', 
      'medical'
    );
  };

  // Render audio wave visualization
  const renderWaveBars = () => {
    // Create different heights for a more realistic waveform
    const heightVariations = [0.6, 0.9, 0.7, 1, 0.8, 0.5, 0.7];
    const barCount = IS_TABLET ? 9 : 7;
    
    return [...Array(barCount)].map((_, index) => {
      const heightMultiplier = heightVariations[index % heightVariations.length];
      
      // Use audio level to influence the wave height
      const dynamicHeight = isRecording ? 
        (0.3 + (audioLevel / 100) * 0.7) * heightMultiplier : 
        heightMultiplier * 0.4;
      
      return (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    backgroundColor: isRecording ? theme.colors.primaryAlphaDark : theme.colors.gray[300],
                    height: 60 * heightMultiplier,
                    transform: [
                      {
                        scaleY: waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            isRecording ? dynamicHeight * 0.8 : 0.2, 
                            isRecording ? dynamicHeight * 1.2 : heightMultiplier
                          ],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryLight]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[
                    styles.waveBarHighlight,
                    {
                      opacity: isRecording ? 1 : 0,
                      height: 60 * heightMultiplier,
                      transform: [
                        {
                          scaleY: waveAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </Animated.View>
      );
    });
  };

  const handlePermissionsGranted = async () => {
    setPermissionsGranted(true);
    try {
      await AsyncStorage.setItem('permissionsGranted', 'true');
    } catch (error) {
      console.error('Error storing permissions status:', error);
    }
  };

  // If permissions are not granted, show the permissions request screen
  if (!permissionsGranted) {
    return <RequestPermissionsScreen onPermissionsGranted={handlePermissionsGranted} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Live streaming indicator at the top */}
      {isRecording && (
        <LinearGradient
          colors={theme.gradients.primary}
          style={styles.liveStreamingBanner}
        >
          <View style={styles.liveStreamingContent}>
            <View style={styles.liveStreamingDot} />
            <Text style={styles.liveStreamingText}>
              🔴 LIVE RECORDING • External Microphone Active
            </Text>
          </View>
        </LinearGradient>
      )}

      <ModernHeader
        title="Consultation Recording"
        subtitle={`Recording with ${patient.firstName} ${patient.lastName}`}
        leftIcon={<ModernIcon name="arrow-left" size={24} color={theme.colors.primary} />}
        onLeftPress={() => {
          if (isRecording) {
            Alert.alert(
              'Stop Recording',
              'Recording is in progress. Do you want to stop and discard?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Stop & Discard', 
                  style: 'destructive',
                  onPress: async () => {
                    if (recordingSession) {
                      try {
                        await RecordingService.stopRecording();
                      } catch (error) {
                        console.error('Error stopping recording:', error);
                      }
                    }
                    navigation.goBack();
                  }
                }
              ]
            );
          } else {
            navigation.goBack();
          }
        }}
        rightIcon={
          <View style={styles.headerRight}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingPulse} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
          </View>
        }
      />

      {/* Premium Patient Info Card */}
      <View style={styles.patientSection}>
        <ModernCard variant="elevated" style={styles.patientCard}>
          <LinearGradient
            colors={[theme.colors.primaryAlphaDark, theme.colors.primaryAlpha]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.patientCardGradient}
          >
            <View style={styles.patientHeader}>
              <View style={styles.patientAvatar}>
                <View style={styles.patientAvatarBorder}>
                  <Text style={styles.patientAvatarText}>
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </Text>
                </View>
              </View>
              <View style={styles.patientInfo}>
                <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                  {patient.firstName} {patient.lastName}
                </Text>
                <View style={styles.patientDetailsRow}>
                  <View style={styles.patientDetailBadge}>
                    <Text style={styles.patientDetailText}>
                      Age {patient.age}
                    </Text>
                  </View>
                  <View style={[styles.patientDetailBadge, { borderColor: theme.colors.primary }]}>
                    <Text style={[styles.patientDetailText, { color: theme.colors.primary }]}>
                      {patient.medicalHistory || 'General Consultation'}
                    </Text>
                  </View>
                </View>
              </View>
              {isRecording && (
                <View style={styles.recBadge}>
                  <View style={styles.recBadgePulse} />
                  <Text style={styles.recBadgeText}>REC</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </ModernCard>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContentContainer}>
          {/* Recording Section */}
          <View style={styles.recordingSection}>
            {/* Duration Display */}
            <View style={styles.durationSection}>
              <Text style={[styles.durationLabel, { color: theme.colors.foregroundSecondary }]}>
                {isRecording ? 'Recording Time' : recordingComplete ? 'Recording Length' : 'Ready to Record'}
              </Text>
              <Animated.Text
                style={[
                  styles.durationValue,
                  {
                    color: isRecording ? theme.colors.primary : theme.colors.foreground,
                    transform: [{ scale: isRecording ? scaleAnimation : 1 }],
                  },
                ]}
              >
                {formatDuration(recordingDuration)}
              </Animated.Text>
            </View>

            {/* Audio Wave Visualization */}
            <View style={styles.waveSection}>
              <View style={styles.waveContainer}>
                {renderWaveBars()}
              </View>
              {isRecording && (
                <Animated.View style={[styles.pulseRing, {
                  borderColor: theme.colors.primary,
                  transform: [{ scale: pulseAnimation }],
                }]} />
              )}
            </View>

            {/* Recording Controls */}
            <View style={styles.buttonSection}>
              <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnimation : 1 }] }}>
                <TouchableOpacity 
                  onPress={handleStartStopRecording}
                  activeOpacity={0.8}
                  disabled={recordingComplete && !isRecording}
                  style={styles.recordButtonWrapper}
                >
                  {isRecording ? (
                    <View style={[styles.recordButtonContainer, styles.recordButtonStop]}>
                      <View style={styles.recordButtonStopGlow} />
                      <View style={styles.recordButtonInner}>
                        <ModernIcon 
                          name="stop" 
                          size={28} 
                          color={theme.colors.medicalError} 
                        />
                        <Text style={[styles.recordButtonText, { color: theme.colors.medicalError }]}>
                          Stop Recording
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.recordButtonContainer,
                        styles.recordButtonStart,
                        recordingComplete && !isRecording && { opacity: 0.5 }
                      ]}
                    >
                      <View style={styles.recordButtonGlow} />
                      <View style={styles.recordButtonInner}>
                        <ModernIcon 
                          name="mic" 
                          size={32} 
                          color={theme.colors.surface} 
                        />
                        <Text style={[styles.recordButtonText, { color: theme.colors.surface }]}>
                          Start Recording
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Playback and Continue Buttons (shown after recording) */}
            {recordingComplete && (
              <View style={styles.postRecordingControls}>
                <ModernButton
                  title={playingAudio ? "Playing..." : "Play Recording"}
                  variant="outline"
                  size="md"
                  onPress={handlePlayRecording}
                  disabled={playingAudio}
                  leftIcon={<ModernIcon name="play" size={20} color={theme.colors.primary} />}
                  style={styles.playButton}
                />
                
                <ModernButton
                  title="Continue to Clinical Notes"
                  variant="gradient"
                  size="md"
                  onPress={handleContinueToClinicalNotes}
                  leftIcon={<ModernIcon name="file-text" size={20} color="#fff" />}
                  style={styles.continueButton}
                />
              </View>
            )}
          </View>

          {/* Guidelines Section */}
          <View style={styles.guidelinesSection}>
            <View style={styles.guidelinesHeader}>
              <ModernIcon name="info" size={24} color={theme.colors.primary} />
              <Text style={styles.guidelinesTitle}>Recording Status</Text>
            </View>
            
            {/* Microphone Status */}
            <View style={[styles.statusBanner, { 
              backgroundColor: recordingError 
                ? 'rgba(255, 0, 102, 0.15)' 
                : isRecording 
                  ? 'rgba(0, 255, 136, 0.15)' 
                  : theme.colors.primaryAlphaDark,
              borderColor: recordingError 
                ? theme.colors.medicalError 
                : isRecording 
                  ? theme.colors.medicalSuccess 
                  : theme.colors.primary,
              borderWidth: 1,
              marginBottom: 16
            }]}>
              <View style={[styles.statusIconContainer, {
                backgroundColor: recordingError 
                  ? 'rgba(255, 0, 102, 0.2)' 
                  : isRecording 
                    ? 'rgba(0, 255, 136, 0.2)' 
                    : theme.colors.primaryAlphaDark,
              }]}>
                <ModernIcon 
                  name={recordingError ? "alert-circle" : isRecording ? "mic" : "info"} 
                  size={24} 
                  color={recordingError 
                    ? theme.colors.medicalError 
                    : isRecording 
                      ? theme.colors.medicalSuccess 
                      : theme.colors.primary} 
                />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[styles.statusTitle, { 
                  color: recordingError 
                    ? theme.colors.medicalError 
                    : isRecording 
                      ? theme.colors.medicalSuccess 
                      : theme.colors.primary
                }]}>
                  {micStatus}
                </Text>
                {recordingError && (
                  <Text style={[styles.errorText, { color: theme.colors.medicalError }]}>{recordingError}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.guidelinesList}>
              <View style={styles.guidelineItem}>
                <ModernIcon name="mic" size={20} color={recordingError ? theme.colors.medicalError : theme.colors.primary} />
                <Text style={[styles.guidelineText, recordingError && {color: theme.colors.medicalError}]}>
                  External microphone connected via OTG is being used for high-quality audio
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <ModernIcon name="volume-2" size={20} color={theme.colors.primary} />
                <Text style={styles.guidelineText}>
                  Audio is automatically amplified for better clarity
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <ModernIcon name="zap" size={20} color={theme.colors.primary} />
                <Text style={styles.guidelineText}>
                  Speak clearly and maintain consistent volume for best results
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <ModernIcon name="brain" size={20} color={theme.colors.primary} />
                <Text style={styles.guidelineText}>
                  AI will automatically transcribe and generate clinical notes
                </Text>
              </View>
            </View>
            
            {/* Status Indicator */}
            <View style={[styles.statusBadge, {
              backgroundColor: isRecording
                ? 'rgba(255, 0, 102, 0.15)'
                : recordingComplete
                ? 'rgba(0, 255, 136, 0.15)'
                : theme.colors.primaryAlphaDark,
              borderColor: isRecording 
                ? theme.colors.medicalError 
                : recordingComplete
                ? theme.colors.medicalSuccess
                : theme.colors.primary,
              borderWidth: 1,
              marginTop: 20
            }]}>
              <View style={[styles.statusBadgeIcon, {
                backgroundColor: isRecording 
                  ? 'rgba(255, 0, 102, 0.2)' 
                  : recordingComplete
                  ? 'rgba(0, 255, 136, 0.2)'
                  : theme.colors.primaryAlphaDark,
              }]}>
                <ModernIcon
                  name={isRecording ? 'record' : recordingComplete ? 'check' : 'info'}
                  size={20}
                  color={isRecording 
                    ? theme.colors.medicalError 
                    : recordingComplete
                    ? theme.colors.medicalSuccess
                    : theme.colors.primary}
                />
              </View>
              <Text style={[styles.statusBadgeText, {
                color: isRecording 
                  ? theme.colors.medicalError 
                  : recordingComplete
                  ? theme.colors.medicalSuccess
                  : theme.colors.primary,
                fontSize: 16
              }]}>
                {isRecording 
                  ? 'Recording Active' 
                  : recordingComplete
                  ? 'Recording Complete'
                  : 'Ready to Record'}
              </Text>
            </View>
          </View>
        </View>
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

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Live streaming banner at top
  liveStreamingBanner: {
    width: '100%',
    paddingVertical: 12,
  },
  liveStreamingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveStreamingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveStreamingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Patient section - Premium Design
  patientSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  patientCard: {
    padding: 0,
    overflow: 'hidden',
    ...theme.shadows.neon,
  },
  patientCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    marginRight: 16,
  },
  patientAvatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primaryLight,
    ...theme.shadows.neon,
  },
  patientAvatarText: {
    color: theme.colors.background,
    fontSize: 20,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  patientDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  patientDetailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryAlpha,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
  },
  patientDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foregroundSecondary,
  },
  recBadge: {
    backgroundColor: theme.colors.medicalError,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'relative',
    overflow: 'visible',
    ...theme.shadows.md,
  },
  recBadgePulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: theme.colors.medicalError,
    opacity: 0.3,
  },
  recBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Main content container - tablet optimized layout
  mainContentContainer: {
    flex: 1,
    flexDirection: IS_TABLET ? 'row' : 'column',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // Recording section
  recordingSection: {
    flex: IS_TABLET ? 2 : 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: IS_TABLET ? 16 : 0,
    paddingBottom: IS_TABLET ? 0 : 16,
  },
  durationSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  durationValue: {
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -2,
    ...theme.shadows.neon,
  },
  waveSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 20,
  },
  waveBar: {
    width: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  waveBarHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    opacity: 0.3,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButtonWrapper: {
    position: 'relative',
  },
  recordButtonContainer: {
    width: width * 0.45,
    maxWidth: 320,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  recordButtonStart: {
    ...theme.shadows.neonGlow,
  },
  recordButtonStop: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: theme.colors.medicalError,
    ...theme.shadows.md,
  },
  recordButtonGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    opacity: 0.2,
  },
  recordButtonStopGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 60,
    backgroundColor: theme.colors.medicalError,
    opacity: 0.2,
  },
  recordButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  // Post recording controls
  postRecordingControls: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    minWidth: 200,
  },
  continueButton: {
    minWidth: 200,
  },
  // Guidelines section - Premium Design
  guidelinesSection: {
    flex: IS_TABLET ? 1 : undefined,
    backgroundColor: theme.colors.primaryAlphaDark,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.primaryAlphaDark,
    ...theme.shadows.neon,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
    color: theme.colors.foreground,
    letterSpacing: -0.5,
  },
  guidelinesText: {
    fontSize: 15,
    marginLeft: 12,
    color: theme.colors.foregroundSecondary,
    flex: 1,
    lineHeight: 22,
  },
  guidelinesList: {
    gap: 20,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  guidelineText: {
    fontSize: 15,
    marginLeft: 12,
    color: theme.colors.foregroundSecondary,
    flex: 1,
    lineHeight: 22,
  },
  // Status badge - Premium Design
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  statusBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Header elements - Premium Design
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.medicalError,
    position: 'relative',
    overflow: 'visible',
    ...theme.shadows.md,
  },
  recordingPulse: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    backgroundColor: theme.colors.medicalError,
    opacity: 0.4,
  },
  recText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    zIndex: 1,
  },
  backButtonContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryAlpha,
  },
});

export default ConsultationRecordingScreen;
