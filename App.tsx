/**
 * MediEaseClinic - Professional Healthcare Management App
 * Audio transcription and clinical notes generation
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/themes/ThemeContext';
import { theme } from './src/themes';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PatientSelectionScreen from './src/screens/PatientSelectionScreen';
import RecordingScreen from './src/screens/RecordingScreen';
import ClinicalNotesScreen from './src/screens/ClinicalNotesScreen';
import PreviousPatientsScreen from './src/screens/PreviousPatientsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: any };
  ClinicalNotes: { patient: any; recordingDuration: number };
  PreviousPatients: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.background}
          />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PatientSelection" component={PatientSelectionScreen} />
            <Stack.Screen name="Recording" component={RecordingScreen} />
            <Stack.Screen name="ClinicalNotes" component={ClinicalNotesScreen} />
            <Stack.Screen name="PreviousPatients" component={PreviousPatientsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
