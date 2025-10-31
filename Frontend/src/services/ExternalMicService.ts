import { NativeModules, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';

// Define the interface for the native module
interface ExternalMicModuleInterface {
  listAudioDevices(): Promise<{ message: string }>;
  startRecording(fileName: string): Promise<{ filePath: string }>;
  stopRecording(): Promise<{
    filePath: string;
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
  }>;
  playRecording(filePath: string): Promise<boolean>;
}

// Get the native module
const ExternalMicModule = NativeModules.ExternalMicModule as ExternalMicModuleInterface;

// Create an event emitter for audio level updates
const externalMicEventEmitter = new NativeEventEmitter(NativeModules.ExternalMicModule);

export interface AudioLevelData {
  level: number; // 0-100 range
}

export class ExternalMicService {
  private static instance: ExternalMicService;
  private audioLevelSubscription: EmitterSubscription | null = null;
  private isRecording: boolean = false;
  private currentFilePath: string | null = null;
  private recordingStartTime: number = 0;
  private audioLevelCallback: ((level: number) => void) | null = null;

  private constructor() {}

  public static getInstance(): ExternalMicService {
    if (!ExternalMicService.instance) {
      ExternalMicService.instance = new ExternalMicService();
    }
    return ExternalMicService.instance;
  }

  /**
   * List available audio devices
   */
  public async listAudioDevices(): Promise<{ 
    message: string;
    devices?: Array<{
      id: string;
      name: string;
      type: string;
      isExternal: boolean;
    }>;
    hasExternalMic: boolean;
  }> {
    if (Platform.OS !== 'android') {
      return { 
        message: 'External microphone support is only available on Android',
        hasExternalMic: false
      };
    }
    
    try {
      const result = await ExternalMicModule.listAudioDevices();
      return result;
    } catch (error) {
      console.error('Error listing audio devices:', error);
      return {
        message: `Error detecting microphones: ${error instanceof Error ? error.message : 'Unknown error'}`,
        hasExternalMic: false
      };
    }
  }

  /**
   * Start recording from the external microphone
   * @param fileName Name for the recording file (without extension)
   * @param onAudioLevel Callback for audio level updates (0-100)
   */
  public async startRecording(
    fileName: string,
    onAudioLevel?: (level: number) => void
  ): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('External microphone support is only available on Android');
    }

    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // Set up audio level listener
      if (onAudioLevel) {
        this.audioLevelCallback = onAudioLevel;
        this.audioLevelSubscription = externalMicEventEmitter.addListener(
          'audioLevelUpdate',
          (data: AudioLevelData) => {
            if (this.audioLevelCallback) {
              this.audioLevelCallback(data.level);
            }
          }
        );
      }

      // Generate a unique filename if none provided
      const actualFileName = fileName || `recording_${Date.now()}`;
      
      // Start recording
      const result = await ExternalMicModule.startRecording(actualFileName);
      
      this.isRecording = true;
      this.currentFilePath = result.filePath;
      this.recordingStartTime = Date.now();
      
      return result.filePath;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanupEventListener();
      throw error;
    }
  }

  /**
   * Stop the current recording
   */
  public async stopRecording(): Promise<{
    filePath: string;
    duration: number;
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
  }> {
    if (Platform.OS !== 'android') {
      throw new Error('External microphone support is only available on Android');
    }

    if (!this.isRecording) {
      throw new Error('Not recording');
    }

    try {
      const result = await ExternalMicModule.stopRecording();
      
      // Calculate duration
      const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      
      // Clean up
      this.cleanupEventListener();
      this.isRecording = false;
      this.currentFilePath = null;
      this.recordingStartTime = 0;
      
      return {
        ...result,
        duration,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.cleanupEventListener();
      throw error;
    }
  }

  /**
   * Play a recording
   * @param filePath Path to the recording file
   */
  public async playRecording(filePath: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      throw new Error('External microphone support is only available on Android');
    }

    try {
      const result = await ExternalMicModule.playRecording(filePath);
      return result === true;
    } catch (error) {
      console.error('Error playing recording:', error);
      return false;
    }
  }

  /**
   * Check if currently recording
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get the current recording duration in seconds
   */
  public getCurrentRecordingDuration(): number {
    if (!this.isRecording || this.recordingStartTime === 0) {
      return 0;
    }
    
    return Math.floor((Date.now() - this.recordingStartTime) / 1000);
  }

  /**
   * Format duration in seconds to MM:SS format
   */
  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clean up event listeners
   */
  private cleanupEventListener(): void {
    if (this.audioLevelSubscription) {
      this.audioLevelSubscription.remove();
      this.audioLevelSubscription = null;
    }
    this.audioLevelCallback = null;
  }
}

export default ExternalMicService.getInstance();
