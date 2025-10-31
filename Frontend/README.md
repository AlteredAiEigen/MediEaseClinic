# MediEaseClinic - External Microphone Recording Feature

## Overview

This feature allows doctors to record consultations using an external microphone connected via OTG to the tablet. The recording is amplified for better clarity and can be played back directly from the app.

## Implementation Details

### Native Module for External Microphone Access

We've implemented a native Android module (`ExternalMicModule`) that provides the following functionality:

- Access to external microphones connected via OTG
- Audio recording with automatic amplification
- Audio playback
- Audio level monitoring for visualization

### Audio Amplification

The audio amplification algorithm is similar to the Python implementation and includes:

1. Normalization to prevent clipping
2. Linear gain application (configurable gain factor)
3. Final clipping prevention to ensure audio stays within bounds

### Recording Flow

1. Doctor selects a patient from the queue
2. Clicks "Start Consultation" to navigate to the recording screen
3. Starts recording using the external microphone
4. Can stop, play back, and continue to clinical notes
5. The amplified audio is saved for later reference

### User Interface

- Real-time audio level visualization
- Recording timer display
- Playback functionality
- Clear recording status indicators

## Technical Notes

### Android Native Module

The native module handles the low-level audio processing:

- Uses Android's `AudioRecord` API to capture audio
- Processes the audio data with amplification
- Saves as WAV file with proper headers
- Provides callbacks for audio levels

### React Native Integration

The feature is integrated into the React Native app through:

- TypeScript interface for the native module
- Updated `RecordingService` that uses the external microphone
- New `ConsultationRecordingScreen` component
- Navigation updates in `RootNavigator` and `DoctorDashboardScreen`

### Permissions

The app requires the following permissions:

- `RECORD_AUDIO` - For microphone access
- `READ_EXTERNAL_STORAGE` - For accessing saved recordings
- `WRITE_EXTERNAL_STORAGE` - For saving recordings

## Usage

1. Connect an external microphone to the tablet via OTG
2. Log in as a doctor
3. Select a patient from the queue
4. Click "Start Consultation"
5. Use the recording controls to start/stop recording
6. Play back the recording if needed
7. Continue to clinical notes

## Future Enhancements

- Support for iOS devices
- Multiple microphone selection
- Advanced audio processing options
- Direct integration with transcription services