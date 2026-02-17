import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  EmotionSelection: undefined;
  ExerciseList: {
    emotionId: string;
    emotionName: string;
  };
  ExerciseSession: {
    exerciseId: string;
    exerciseName: string;
    emotionId: string;
  };
  SessionResult: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    duration: number;
    completedAt: Date;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  EmotionPicker: undefined;
  ExerciseList: {
    emotionId: string;
    emotionName: string;
  };
  ExerciseSession: {
    exerciseId: string;
    exerciseName: string;
    emotionId: string;
  };
  SessionResult: {
    sessionId: string;
    exerciseId: string;
    exerciseName: string;
    duration: number;
    completedAt: Date;
  };
};

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type StatisticsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Statistics'>,
  StackNavigationProp<RootStackParamList>
>;

export type AchievementsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Achievements'>,
  StackNavigationProp<RootStackParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

export type EmotionSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EmotionSelection'
>;

export type ExerciseListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExerciseList'
>;

export type ExerciseListScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseList'
>;

export type ExerciseSessionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExerciseSession'
>;

export type ExerciseSessionScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseSession'
>;

export type SessionResultScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SessionResult'
>;

export type SessionResultScreenRouteProp = RouteProp<
  RootStackParamList,
  'SessionResult'
>;

export type HomeScreenRouteProp = RouteProp<MainTabParamList, 'Home'>;
export type StatisticsScreenRouteProp = RouteProp<MainTabParamList, 'Statistics'>;
export type AchievementsScreenRouteProp = RouteProp<MainTabParamList, 'Achievements'>;
export type SettingsScreenRouteProp = RouteProp<MainTabParamList, 'Settings'>;