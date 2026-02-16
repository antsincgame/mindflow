import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import EmotionPickerScreen from '../screens/EmotionPickerScreen';
import ExerciseListScreen from '../screens/ExerciseListScreen';
import ExerciseSessionScreen from '../screens/ExerciseSessionScreen';
import SessionResultScreen from '../screens/SessionResultScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmotionPicker"
        component={EmotionPickerScreen}
        options={{
          headerShown: true,
          headerTitle: 'Как ты себя чувствуешь?',
          headerBackTitle: 'Назад',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerTransparent: false,
          headerBlurEffect: 'regular',
        }}
      />
      <Stack.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{
          headerShown: true,
          headerTitle: 'Упражнения',
          headerBackTitle: 'Назад',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerBlurEffect: 'regular',
        }}
      />
      <Stack.Screen
        name="ExerciseSession"
        component={ExerciseSessionScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="SessionResult"
        component={SessionResultScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade_from_bottom',
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;