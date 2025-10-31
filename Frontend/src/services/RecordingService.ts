import { Platform, Alert } from 'react-native';
import StorageService from './StorageService';
import ExternalMicService from './ExternalMicService';

export interface Recording {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  duration: number; // in seconds
  filePath?: string; // For actual audio files
  transcription?: string;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface RecordingSession {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  isRecording: boolean;
  audioLevel: number;
}

export class RecordingService {
  private storageService: StorageService;
  private currentSession: RecordingSession | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storageService = StorageService;
  }

  // Recording session management
  async startRecording(patientId: string, appointmentId: string, doctorId: string): Promise<RecordingSession> {
    if (this.currentSession?.isRecording) {
      throw new Error('Recording already in progress');
    }

    const sessionId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      patientId,
      appointmentId,
      doctorId,
      startTime: Date.now(),
      duration: 0,
      isRecording: true,
      audioLevel: 0,
    };

    try {
      // Use external mic if on Android, otherwise fallback to simulation
      if (Platform.OS === 'android') {
        // Start recording with external mic and update audio level
        await ExternalMicService.startRecording(
          sessionId,
          (level) => {
            if (this.currentSession) {
              this.currentSession.audioLevel = level;
            }
          }
        );
      } else {
        // Start the recording simulation on iOS or other platforms
        this.startRecordingSimulation();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      // Fallback to simulation if external mic fails
      this.startRecordingSimulation();
    }

    return this.currentSession;
  }

  async stopRecording(): Promise<Recording> {
    if (!this.currentSession || !this.currentSession.isRecording) {
      throw new Error('No recording session in progress');
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - this.currentSession.startTime) / 1000);
    let filePath: string | undefined = undefined;

    try {
      // Use external mic if on Android, otherwise fallback to simulation
      if (Platform.OS === 'android') {
        // Stop recording with external mic
        const result = await ExternalMicService.stopRecording();
        filePath = result.filePath;
      } else {
        // Stop the recording simulation on iOS or other platforms
        this.stopRecordingSimulation();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Stop the recording simulation as fallback
      this.stopRecordingSimulation();
    }

    const recording: Recording = {
      id: this.currentSession.id,
      patientId: this.currentSession.patientId,
      appointmentId: this.currentSession.appointmentId,
      doctorId: this.currentSession.doctorId,
      duration,
      filePath, // Add the file path if available
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save the recording
    await this.saveRecording(recording);

    // Simulate processing delay
    setTimeout(async () => {
      await this.processRecording(recording.id);
    }, 2000);

    this.currentSession = null;
    return recording;
  }

  async pauseRecording(): Promise<void> {
    if (!this.currentSession || !this.currentSession.isRecording) {
      throw new Error('No recording session in progress');
    }

    this.stopRecordingSimulation();
    this.currentSession.isRecording = false;
  }

  async resumeRecording(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No recording session found');
    }

    if (this.currentSession.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.currentSession.isRecording = true;
    this.startRecordingSimulation();
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  // Recording simulation (since we don't have actual audio recording)
  private startRecordingSimulation(): void {
    this.recordingInterval = setInterval(() => {
      if (this.currentSession && this.currentSession.isRecording) {
        this.currentSession.duration = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        this.currentSession.audioLevel = Math.random() * 100; // Simulate audio level
      }
    }, 100);
  }

  private stopRecordingSimulation(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  // Recording data management
  async saveRecording(recording: Recording): Promise<void> {
    const recordings = await this.storageService.getRecordings();
    recordings.push(recording);
    await this.storageService.saveRecordings(recordings);
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    const recordings = await this.storageService.getRecordings();
    return recordings.find(recording => recording.id === id) || null;
  }

  async getRecordingsByPatient(patientId: string): Promise<Recording[]> {
    const recordings = await this.storageService.getRecordings();
    return recordings.filter(recording => recording.patientId === patientId);
  }

  async getRecordingsByAppointment(appointmentId: string): Promise<Recording[]> {
    const recordings = await this.storageService.getRecordings();
    return recordings.filter(recording => recording.appointmentId === appointmentId);
  }

  async getAllRecordings(): Promise<Recording[]> {
    return await this.storageService.getRecordings();
  }

  // Processing simulation
  private async processRecording(recordingId: string): Promise<void> {
    try {
      const recording = await this.getRecordingById(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      // Simulate AI transcription processing
      const mockTranscription = await this.generateMockTranscription(recording);
      
      // Update recording with transcription
      const recordings = await this.storageService.getRecordings();
      const recordingIndex = recordings.findIndex(r => r.id === recordingId);
      
      if (recordingIndex !== -1) {
        recordings[recordingIndex] = {
          ...recordings[recordingIndex],
          transcription: mockTranscription,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        };
        
        await this.storageService.saveRecordings(recordings);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      
      // Mark recording as failed
      const recordings = await this.storageService.getRecordings();
      const recordingIndex = recordings.findIndex(r => r.id === recordingId);
      
      if (recordingIndex !== -1) {
        recordings[recordingIndex] = {
          ...recordings[recordingIndex],
          status: 'failed',
          updatedAt: new Date().toISOString(),
        };
        
        await this.storageService.saveRecordings(recordings);
      }
    }
  }

  // Mock transcription generation
  private async generateMockTranscription(recording: Recording): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock transcription based on recording duration
    const duration = recording.duration;
    let transcription = '';
    
    if (duration < 30) {
      transcription = `Brief consultation recorded. Duration: ${duration} seconds. Patient discussed minor symptoms and received basic advice.`;
    } else if (duration < 120) {
      transcription = `Standard consultation recorded. Duration: ${duration} seconds. Patient presented with symptoms, discussed medical history, and received treatment recommendations. Doctor provided detailed examination and care instructions.`;
    } else {
      transcription = `Comprehensive consultation recorded. Duration: ${duration} seconds. Extended discussion of patient's condition, detailed medical history review, thorough examination, and comprehensive treatment plan. Multiple symptoms addressed with detailed care instructions and follow-up recommendations.`;
    }
    
    return transcription;
  }

  // Audio level simulation for UI
  getAudioLevel(): number {
    if (!this.currentSession || !this.currentSession.isRecording) {
      return 0;
    }
    return this.currentSession.audioLevel;
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Play a recorded audio file
  async playRecording(recordingId: string): Promise<boolean> {
    try {
      const recording = await this.getRecordingById(recordingId);
      
      if (!recording) {
        console.error('Recording not found');
        return false;
      }
      
      if (!recording.filePath) {
        console.error('Recording has no file path');
        return false;
      }
      
      if (Platform.OS === 'android') {
        // Use external mic service to play the recording
        const success = await ExternalMicService.playRecording(recording.filePath);
        return success;
      } else {
        // For iOS or other platforms, we'd need to implement audio playback
        console.warn('Audio playback not implemented for this platform');
        return false;
      }

    } catch (error) {
      console.error('Error playing recording:', error);
      return false;
    }
  }

  // Statistics
  async getRecordingStatistics(): Promise<{
    totalRecordings: number;
    totalDuration: number;
    averageDuration: number;
    completedRecordings: number;
    failedRecordings: number;
  }> {
    const recordings = await this.storageService.getRecordings();
    
    const totalDuration = recordings.reduce((sum, recording) => sum + recording.duration, 0);
    const completedRecordings = recordings.filter(r => r.status === 'completed').length;
    const failedRecordings = recordings.filter(r => r.status === 'failed').length;
    
    return {
      totalRecordings: recordings.length,
      totalDuration,
      averageDuration: recordings.length > 0 ? Math.floor(totalDuration / recordings.length) : 0,
      completedRecordings,
      failedRecordings,
    };
  }

  // Cleanup
  async deleteRecording(id: string): Promise<void> {
    const recordings = await this.storageService.getRecordings();
    const filteredRecordings = recordings.filter(recording => recording.id !== id);
    await this.storageService.saveRecordings(filteredRecordings);
  }

  async deleteRecordingsByPatient(patientId: string): Promise<void> {
    const recordings = await this.storageService.getRecordings();
    const filteredRecordings = recordings.filter(recording => recording.patientId !== patientId);
    await this.storageService.saveRecordings(filteredRecordings);
  }

  // Export/Import
  async exportRecordings(): Promise<string> {
    const recordings = await this.storageService.getRecordings();
    return JSON.stringify(recordings, null, 2);
  }

  async importRecordings(jsonData: string): Promise<Recording[]> {
    try {
      const importedRecordings = JSON.parse(jsonData);
      if (!Array.isArray(importedRecordings)) {
        throw new Error('Invalid data format');
      }

      const recordings = await this.storageService.getRecordings();
      const newRecordings = importedRecordings.map(recording => ({
        ...recording,
        id: recording.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      recordings.push(...newRecordings);
      await this.storageService.saveRecordings(recordings);
      
      return newRecordings;
    } catch (error) {
      throw new Error('Failed to import recordings: ' + error);
    }
  }

  // Cleanup on destroy
  destroy(): void {
    this.stopRecordingSimulation();
    this.currentSession = null;
  }
}

export default new RecordingService();
