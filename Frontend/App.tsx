/**
 * MediEaseClinic - Professional Healthcare Management App
 * Modern clinic management system with audio transcription and clinical notes
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/themes/ThemeContext';
import { AppProvider } from './src/context/AppContext';
import { PatientsProvider } from './src/context/PatientsContext';
import { AppointmentsProvider } from './src/context/AppointmentsContext';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
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
