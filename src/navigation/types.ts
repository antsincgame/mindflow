export type RootStackParamList = {
  MainTabs: undefined;
  SessionScreen: {
    taskName?: string;
    duration?: number;
  };
  SessionCompleteScreen: {
    sessionId: number;
    duration: number;
    taskName?: string;
  };
  BreakScreen: {
    sessionId: number;
    duration: number;
  };
};

export type MainTabsParamList = {
  Home: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  SessionScreen: {
    taskName?: string;
    duration?: number;
  };
  SessionCompleteScreen: {
    sessionId: number;
    duration: number;
    taskName?: string;
  };
  BreakScreen: {
    sessionId: number;
    duration: number;
  };
};

export type StatisticsStackParamList = {
  StatisticsScreen: undefined;
};

export type AchievementsStackParamList = {
  AchievementsScreen: undefined;
};

export type SettingsStackParamList = {
  SettingsScreen: undefined;
};

export interface NavigationScreenProps<T extends keyof RootStackParamList = 'MainTabs'> {
  route: {
    key: string;
    name: T;
    params?: RootStackParamList[T];
  };
  navigation: any;
}

export interface TabScreenProps<T extends keyof MainTabsParamList = 'Home'> {
  route: {
    key: string;
    name: T;
    params?: MainTabsParamList[T];
  };
  navigation: any;
}