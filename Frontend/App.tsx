/**
 * MediEaseClinic - Professional Healthcare Management App
 * Modern clinic management system with audio transcription and clinical notes
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/themes/ThemeContext';
import { AppProvider } from './src/context/AppContext';
import { PatientsProvider } from './src/context/PatientsContext';
import { AppointmentsProvider } from './src/context/AppointmentsContext';
import RootNavigator from './src/navigation/RootNavigator';
import addDemoPatient from './src/utils/addDemoPatient';

const App = () => {
  // Import the demo patient module to ensure it runs
  useEffect(() => {
    // Dynamic import to ensure it runs after the app is initialized
    import('./src/utils/addDemoPatient').then(() => {
      console.log('Demo patient module imported');
    }).catch(err => {
      console.error('Error importing demo patient module:', err);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <PatientsProvider>
              <AppointmentsProvider>
                <StatusBar barStyle="dark-content" />
                <RootNavigator />
              </AppointmentsProvider>
            </PatientsProvider>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
