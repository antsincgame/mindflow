import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeStackNavigator from './HomeStackNavigator';
import StatisticsScreen from '../screens/StatisticsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { RootTabParamList } from './types';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator<RootTabParamList>();

const getTabBarIcon = (routeName: keyof RootTabParamList, focused: boolean, color: string, size: number): React.ReactNode => {
  let iconName: string;

  switch (routeName) {
    case 'HomeTab':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'StatisticsTab':
      iconName = focused ? 'stats-chart' : 'stats-chart-outline';
      break;
    case 'AchievementsTab':
      iconName = focused ? 'trophy' : 'trophy-outline';
      break;
    case 'SettingsTab':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return <Icon name={iconName} size={size} color={color} />;
};

const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) =>
            getTabBarIcon(route.name, focused, color, size),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark ? '#8E8E93' : '#A0A0A8',
          tabBarStyle: {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            height: Platform.OS === 'ios' ? 88 : 64,
            elevation: 0,
            shadowColor: isDark ? '#000000' : '#8E8E93',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
          tabBarHideOnKeyboard: true,
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{
            tabBarLabel: 'Главная',
          }}
        />
        <Tab.Screen
          name="StatisticsTab"
          component={StatisticsScreen}
          options={{
            tabBarLabel: 'Статистика',
          }}
        />
        <Tab.Screen
          name="AchievementsTab"
          component={AchievementsScreen}
          options={{
            tabBarLabel: 'Достижения',
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Настройки',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;