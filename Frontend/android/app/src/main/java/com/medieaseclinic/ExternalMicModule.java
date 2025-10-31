package com.medieaseclinic;

import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

public class ExternalMicModule extends ReactContextBaseJavaModule {
    private static final String TAG = "ExternalMicModule";
    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;
    private static final int BUFFER_SIZE = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT) * 2;
    
    private AudioRecord audioRecord;
    private Thread recordingThread;
    private final AtomicBoolean isRecording = new AtomicBoolean(false);
    private String filePath;
    private final List<Short> audioBuffer = new ArrayList<>();
    private MediaPlayer mediaPlayer;

    public ExternalMicModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "ExternalMicModule";
    }

    @ReactMethod
    public void listAudioDevices(Promise promise) {
        try {
            // Get a list of available audio input devices
            WritableMap result = Arguments.createMap();
            WritableArray devices = Arguments.createArray();
            
            try {
                android.media.AudioDeviceInfo[] audioDevices = 
                    ((android.media.AudioManager) getReactApplicationContext().getSystemService(android.content.Context.AUDIO_SERVICE))
                    .getDevices(android.media.AudioManager.GET_DEVICES_INPUTS);
                
                if (audioDevices.length > 0) {
                    for (android.media.AudioDeviceInfo device : audioDevices) {
                        WritableMap deviceInfo = Arguments.createMap();
                        deviceInfo.putString("id", String.valueOf(device.getId()));
                        deviceInfo.putString("name", device.getProductName().toString());
                        deviceInfo.putString("type", getDeviceTypeName(device.getType()));
                        deviceInfo.putBoolean("isExternal", isExternalDevice(device.getType()));
                        devices.pushMap(deviceInfo);
                    }
                    
                    result.putArray("devices", devices);
                    result.putString("message", "Found " + audioDevices.length + " audio input devices");
                    result.putBoolean("hasExternalMic", hasExternalMicrophone(audioDevices));
                } else {
                    result.putArray("devices", devices);
                    result.putString("message", "No audio input devices found");
                    result.putBoolean("hasExternalMic", false);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error getting audio devices", e);
                result.putString("message", "Error getting audio devices: " + e.getMessage());
                result.putBoolean("hasExternalMic", false);
            }
            
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERR_UNEXPECTED_EXCEPTION", e);
        }
    }
    
    private boolean hasExternalMicrophone(android.media.AudioDeviceInfo[] devices) {
        for (android.media.AudioDeviceInfo device : devices) {
            if (isExternalDevice(device.getType())) {
                return true;
            }
        }
        return false;
    }
    
    private boolean isExternalDevice(int deviceType) {
        return deviceType == android.media.AudioDeviceInfo.TYPE_USB_DEVICE ||
               deviceType == android.media.AudioDeviceInfo.TYPE_USB_HEADSET ||
               deviceType == android.media.AudioDeviceInfo.TYPE_USB_ACCESSORY ||
               deviceType == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET ||
               deviceType == android.media.AudioDeviceInfo.TYPE_LINE_ANALOG ||
               deviceType == android.media.AudioDeviceInfo.TYPE_LINE_DIGITAL;
    }
    
    private String getDeviceTypeName(int deviceType) {
        switch (deviceType) {
            case android.media.AudioDeviceInfo.TYPE_BUILTIN_MIC: return "Built-in Microphone";
            case android.media.AudioDeviceInfo.TYPE_USB_DEVICE: return "USB Device";
            case android.media.AudioDeviceInfo.TYPE_USB_HEADSET: return "USB Headset";
            case android.media.AudioDeviceInfo.TYPE_USB_ACCESSORY: return "USB Accessory";
            case android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET: return "Wired Headset";
            case android.media.AudioDeviceInfo.TYPE_LINE_ANALOG: return "Analog Line-In";
            case android.media.AudioDeviceInfo.TYPE_LINE_DIGITAL: return "Digital Line-In";
            default: return "Unknown Device Type: " + deviceType;
        }
    }

    @ReactMethod
    public void startRecording(String fileName, Promise promise) {
        if (isRecording.get()) {
            promise.reject("ERR_ALREADY_RECORDING", "Already recording");
            return;
        }

        try {
            // Check for RECORD_AUDIO permission
            if (getReactApplicationContext().checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("ERR_PERMISSION_DENIED", "RECORD_AUDIO permission not granted");
                return;
            }

            boolean requiresLegacyStoragePermission = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q;

            // Check for WRITE_EXTERNAL_STORAGE permission on legacy devices only
            if (requiresLegacyStoragePermission &&
                getReactApplicationContext().checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                    != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                promise.reject("ERR_PERMISSION_DENIED", "WRITE_EXTERNAL_STORAGE permission not granted");
                return;
            }

            // Stop any playback before starting a new recording
            cleanupMediaPlayer();

            // Create directory for recordings
            File directory = new File(getReactApplicationContext().getExternalFilesDir(Environment.DIRECTORY_MUSIC), "MediEaseRecordings");
            if (!directory.exists()) {
                if (!directory.mkdirs()) {
                    promise.reject("ERR_CREATE_DIR", "Could not create directory");
                    return;
                }
            }

            filePath = new File(directory, fileName + ".wav").getAbsolutePath();
            audioBuffer.clear();

            // Try to detect the best audio source
            int audioSource = findBestAudioSource();
            Log.d(TAG, "Using audio source: " + audioSource);

            // Create the AudioRecord with larger buffer
            int bufferSize = Math.max(
                AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT) * 4,
                BUFFER_SIZE
            );
            
            try {
                audioRecord = new AudioRecord(
                        audioSource,
                        SAMPLE_RATE,
                        CHANNEL_CONFIG,
                        AUDIO_FORMAT,
                        bufferSize
                );
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize AudioRecord with selected source, trying default MIC", e);
                // Fall back to default MIC source
                audioRecord = new AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        SAMPLE_RATE,
                        CHANNEL_CONFIG,
                        AUDIO_FORMAT,
                        bufferSize
                );
            }

            if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                audioRecord.release();
                
                // Try one more time with different parameters
                Log.d(TAG, "Retrying with different audio parameters");
                audioRecord = new AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        16000, // Lower sample rate
                        AudioFormat.CHANNEL_IN_MONO,
                        AudioFormat.ENCODING_PCM_16BIT,
                        AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT) * 2
                );
                
                if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                    audioRecord.release();
                    promise.reject("ERR_AUDIO_RECORD", "AudioRecord initialization failed. Make sure microphone permissions are granted and the device is connected properly.");
                    return;
                }
            }

            isRecording.set(true);
            audioRecord.startRecording();

            recordingThread = new Thread(this::recordingLoop, "AudioRecordingThread");
            recordingThread.start();

            WritableMap result = Arguments.createMap();
            result.putString("filePath", filePath);
            result.putString("source", getAudioSourceName(audioSource));
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error starting recording", e);
            promise.reject("ERR_RECORDING_FAILED", e.getMessage());
        }
    }
    
    private int findBestAudioSource() {
        // Try to find the best audio source for external microphones
        android.media.AudioDeviceInfo[] devices = 
            ((android.media.AudioManager) getReactApplicationContext().getSystemService(android.content.Context.AUDIO_SERVICE))
            .getDevices(android.media.AudioManager.GET_DEVICES_INPUTS);
            
        for (android.media.AudioDeviceInfo device : devices) {
            if (isExternalDevice(device.getType())) {
                // Found an external device, prefer CAMCORDER or UNPROCESSED sources
                Log.d(TAG, "Found external audio device: " + device.getProductName());
                return MediaRecorder.AudioSource.CAMCORDER;
            }
        }
        
        // No external device found, use default MIC source
        return MediaRecorder.AudioSource.MIC;
    }
    
    private String getAudioSourceName(int source) {
        switch (source) {
            case MediaRecorder.AudioSource.MIC: return "Microphone";
            case MediaRecorder.AudioSource.CAMCORDER: return "Camcorder";
            case MediaRecorder.AudioSource.VOICE_RECOGNITION: return "Voice Recognition";
            case MediaRecorder.AudioSource.VOICE_COMMUNICATION: return "Voice Communication";
            case MediaRecorder.AudioSource.UNPROCESSED: return "Unprocessed";
            default: return "Unknown (" + source + ")";
        }
    }

    private void recordingLoop() {
        short[] buffer = new short[BUFFER_SIZE / 2];
        long lastEmitTime = System.currentTimeMillis();
        
        while (isRecording.get()) {
            int read = audioRecord.read(buffer, 0, buffer.length);
            
            if (read > 0) {
                // Store the audio data for later processing
                for (int i = 0; i < read; i++) {
                    audioBuffer.add(buffer[i]);
                }
                
                // Calculate audio level for visualization (every 100ms)
                long currentTime = System.currentTimeMillis();
                if (currentTime - lastEmitTime > 100) {
                    float audioLevel = calculateAudioLevel(buffer, read);
                    emitAudioLevel(audioLevel);
                    lastEmitTime = currentTime;
                }
            }
        }
    }

    private float calculateAudioLevel(short[] buffer, int size) {
        // Calculate RMS (root mean square) of the buffer
        double sum = 0;
        for (int i = 0; i < size; i++) {
            sum += buffer[i] * buffer[i];
        }
        double rms = Math.sqrt(sum / size);
        
        // Normalize to a 0-100 range
        return (float) Math.min(100, Math.max(0, rms / 32767 * 100));
    }

    private void emitAudioLevel(float level) {
        WritableMap params = Arguments.createMap();
        params.putDouble("level", level);
        
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("audioLevelUpdate", params);
    }

    private void cleanupMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (IllegalStateException ignored) {
                // Player might already be stopped
            }
            mediaPlayer.reset();
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private void sendPlaybackEvent(String eventName, String message) {
        WritableMap params = Arguments.createMap();
        params.putString("message", message);
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void stopRecording(Promise promise) {
        if (!isRecording.get()) {
            promise.reject("ERR_NOT_RECORDING", "Not recording");
            return;
        }

        isRecording.set(false);

        try {
            if (recordingThread != null) {
                recordingThread.join();
                recordingThread = null;
            }

            if (audioRecord != null) {
                audioRecord.stop();
                audioRecord.release();
                audioRecord = null;
            }

            // Process and save the recorded audio
            processAndSaveAudio();

            WritableMap result = Arguments.createMap();
            result.putString("filePath", filePath);
            result.putInt("sampleRate", SAMPLE_RATE);
            result.putInt("channels", 1); // Mono
            result.putInt("bitsPerSample", 16); // PCM_16BIT
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping recording", e);
            promise.reject("ERR_STOP_RECORDING", e);
        }
    }

    private void processAndSaveAudio() throws IOException {
        if (audioBuffer.isEmpty()) {
            return;
        }

        // Convert list to array for processing
        short[] audioData = new short[audioBuffer.size()];
        for (int i = 0; i < audioBuffer.size(); i++) {
            audioData[i] = audioBuffer.get(i);
        }

        // Write WAV file with gentle gain applied
        short[] processedAudio = applyModerateGain(audioData);
        writeWavFile(filePath, processedAudio, SAMPLE_RATE);
    }

    private short[] applyModerateGain(short[] audio) {
        if (audio.length == 0) {
            return audio;
        }

        // Convert to float for processing and find peak amplitude
        float[] floatAudio = new float[audio.length];
        float maxAbs = 0f;
        for (int i = 0; i < audio.length; i++) {
            float sample = audio[i] / 32768f;
            floatAudio[i] = sample;
            maxAbs = Math.max(maxAbs, Math.abs(sample));
        }

        if (maxAbs < 1e-6f) {
            return audio;
        }

        // Target peak at 85% of full scale, but limit amplification to 1.8x
        float desiredPeak = 0.85f;
        float gain = Math.min(desiredPeak / maxAbs, 1.8f);

        short[] result = new short[audio.length];
        for (int i = 0; i < floatAudio.length; i++) {
            float scaled = floatAudio[i] * gain;
            // Clamp to prevent clipping distortion
            scaled = Math.max(-1f, Math.min(1f, scaled));
            result[i] = (short) (scaled * 32767f);
        }

        return result;
    }

    private void writeWavFile(String filePath, short[] audioData, int sampleRate) throws IOException {
        FileOutputStream out = new FileOutputStream(filePath);
        
        // WAV header
        writeWavHeader(out, audioData.length, sampleRate);
        
        // Write audio data
        ByteBuffer buffer = ByteBuffer.allocate(audioData.length * 2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        ShortBuffer shortBuffer = buffer.asShortBuffer();
        shortBuffer.put(audioData);
        
        out.write(buffer.array());
        out.close();
    }

    private void writeWavHeader(FileOutputStream out, int audioDataLength, int sampleRate) throws IOException {
        int channels = 1; // mono
        int bitsPerSample = 16;
        int byteRate = sampleRate * channels * bitsPerSample / 8;
        int blockAlign = channels * bitsPerSample / 8;
        int dataSize = audioDataLength * blockAlign;
        int totalSize = 36 + dataSize;

        ByteBuffer buffer = ByteBuffer.allocate(44);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        // RIFF header
        buffer.put("RIFF".getBytes());
        buffer.putInt(totalSize);
        buffer.put("WAVE".getBytes());

        // Format chunk
        buffer.put("fmt ".getBytes());
        buffer.putInt(16); // Subchunk1Size (16 for PCM)
        buffer.putShort((short) 1); // AudioFormat (1 for PCM)
        buffer.putShort((short) channels); // NumChannels
        buffer.putInt(sampleRate); // SampleRate
        buffer.putInt(byteRate); // ByteRate
        buffer.putShort((short) blockAlign); // BlockAlign
        buffer.putShort((short) bitsPerSample); // BitsPerSample

        // Data chunk
        buffer.put("data".getBytes());
        buffer.putInt(dataSize); // Subchunk2Size

        out.write(buffer.array());
    }

    @ReactMethod
    public void playRecording(String filePath, Promise promise) {
        if (filePath == null || filePath.isEmpty()) {
            promise.reject("ERR_INVALID_FILE", "Invalid file path");
            return;
        }

        try {
            File recordingFile = new File(filePath);
            if (!recordingFile.exists()) {
                promise.reject("ERR_FILE_NOT_FOUND", "Recording file not found");
                return;
            }

            cleanupMediaPlayer();

            mediaPlayer = new MediaPlayer();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build());
            } else {
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
            }

            mediaPlayer.setDataSource(recordingFile.getAbsolutePath());
            mediaPlayer.setOnCompletionListener(mp -> {
                cleanupMediaPlayer();
                sendPlaybackEvent("playbackCompleted", "Playback completed");
            });
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                String errorMessage = "Playback error: " + what + "/" + extra;
                Log.e(TAG, errorMessage);
                cleanupMediaPlayer();
                sendPlaybackEvent("playbackError", errorMessage);
                return true;
            });

            mediaPlayer.prepare();
            mediaPlayer.start();

            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error playing recording", e);
            cleanupMediaPlayer();
            promise.reject("ERR_PLAYBACK_FAILED", e);
        }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        cleanupMediaPlayer();
    }
}
