import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../themes/ThemeContext';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';

interface Props {
  onPermissionsGranted: () => void;
}

const RequestPermissionsScreen: React.FC<Props> = ({ onPermissionsGranted }) => {
  const theme = useTheme();
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const androidApiLevel = useMemo(() => {
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

  useEffect(() => {
    checkPermissionsStatus();
  }, []);
  
  const checkPermissionsStatus = async () => {
    try {
      // Always check the actual system permissions first
      if (Platform.OS === 'android') {
        const micPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        let storagePermissionGranted = true;

        if (requiresLegacyStoragePermission) {
          storagePermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        }
        
        if (micPermission && storagePermissionGranted) {
          console.log('System permissions are already granted');
          setPermissionsChecked(true);
          setPermissionsGranted(true);
          // Update storage to match actual permissions
          await AsyncStorage.setItem('permissionsGranted', 'true');
          onPermissionsGranted();
          return;
        }
      } else {
        // iOS doesn't need runtime permissions for this app
        setPermissionsChecked(true);
        setPermissionsGranted(true);
        await AsyncStorage.setItem('permissionsGranted', 'true');
        onPermissionsGranted();
        return;
      }
      
      // If system permissions not granted, check if we've stored permission status
      const permissionsGrantedBefore = await AsyncStorage.getItem('permissionsGranted');
      if (permissionsGrantedBefore === 'true') {
        // Clear the stored value since actual permissions aren't granted
        await AsyncStorage.removeItem('permissionsGranted');
      }
      
      // Continue with permission request flow
      checkPermissions();
    } catch (error) {
      console.error('Error checking permissions status:', error);
      checkPermissions();
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS !== 'android') {
      // iOS doesn't need runtime permissions for this app
      setPermissionsChecked(true);
      setPermissionsGranted(true);
      onPermissionsGranted();
      return;
    }

    try {
      const micPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      let storagePermissionGranted = true;

      if (requiresLegacyStoragePermission) {
        storagePermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      }
      
      setPermissionsChecked(true);
      
      if (micPermission && storagePermissionGranted) {
        setPermissionsGranted(true);
        // Store that permissions were granted
        try {
          await AsyncStorage.setItem('permissionsGranted', 'true');
        } catch (error) {
          console.error('Error storing permissions status:', error);
        }
        onPermissionsGranted();
      } else {
        setPermissionsGranted(false);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionsChecked(true);
      setPermissionsGranted(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

      if (requiresLegacyStoragePermission) {
        permissionsToRequest.push(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }

      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

      const allGranted = permissionsToRequest.every(permission =>
        results[permission] === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        setPermissionsGranted(true);
        // Store that permissions were granted
        try {
          await AsyncStorage.setItem('permissionsGranted', 'true');
        } catch (error) {
          console.error('Error storing permissions status:', error);
        }
        onPermissionsGranted();
      } else {
        Alert.alert(
          'Permissions Required',
          requiresLegacyStoragePermission
            ? 'This app needs microphone and storage access to record audio. Please grant these permissions in your device settings.'
            : 'This app needs microphone access to record audio. Please grant this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  if (!permissionsChecked) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Checking permissions...</Text>
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ModernIcon name="mic-off" size={64} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Microphone Access Required</Text>
        <Text style={[styles.description, { color: theme.colors.foregroundSecondary }]}>
          {requiresLegacyStoragePermission
            ? 'This app needs access to your microphone and storage to record consultations. Please grant these permissions to continue.'
            : 'This app needs access to your microphone to record consultations. Please grant this permission to continue.'}
        </Text>
        <ModernButton
          title="Grant Permissions"
          variant="gradient"
          size="lg"
          onPress={requestPermissions}
          style={styles.button}
        />
      </View>
    );
  }

  return null; // Permissions granted, component will unmount
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '80%',
    maxWidth: 300,
  },
});

export default RequestPermissionsScreen;
