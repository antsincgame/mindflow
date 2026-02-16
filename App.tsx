import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useDatabase } from './src/hooks/useDatabase';
import { useNotifications } from './src/hooks/useNotifications';
import { AppContext } from './src/context/AppContext';
import { SessionContext } from './src/context/SessionContext';
import { useSession } from './src/hooks/useSession';
import { useSettings } from './src/hooks/useSettings';
import { useStatistics } from './src/hooks/useStatistics';
import { useAchievements } from './src/hooks/useAchievements';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AppContent: React.FC = () => {
  const [appReady, setAppReady] = useState(false);
  const { isInitialized: dbInitialized } = useDatabase();
  const { requestPermissions } = useNotifications();
  const { settings } = useSettings();
  const { statistics } = useStatistics();
  const { achievements } = useAchievements();
  const sessionState = useSession();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await requestPermissions();
        
        if (dbInitialized) {
          setAppReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    if (dbInitialized) {
      initializeApp();
    }
  }, [dbInitialized, requestPermissions]);

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContext.Provider
          value={{
            settings,
            statistics,
            achievements,
          }}
        >
          <SessionContext.Provider value={sessionState}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar barStyle="light-content" />
          </SessionContext.Provider>
        </AppContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default AppContent;