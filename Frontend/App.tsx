/**
 * MediEaseClinic - Professional Healthcare Management App
 * Modern clinic management system with audio transcription and clinical notes
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { ThemeProvider } from './src/themes/ThemeContext';
import { AppProvider } from './src/context/AppContext';
import { PatientsProvider } from './src/context/PatientsContext';
import { AppointmentsProvider } from './src/context/AppointmentsContext';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <View style={{ flex: 1 }}>
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
    </View>
  );
};

export default App;
