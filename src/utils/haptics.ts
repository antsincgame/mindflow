import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

const defaultOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const isHapticSupported = Platform.OS === 'ios';

/**
 * Trigger haptic feedback safely with platform check
 */
const triggerHaptic = (
  type: HapticFeedbackTypes,
  options = defaultOptions
): void => {
  try {
    if (isHapticSupported) {
      ReactNativeHapticFeedback.trigger(type, options);
    }
  } catch (error) {
    // Silently fail if haptic feedback is not available
    if (__DEV__) {
      console.warn('[Haptics] Failed to trigger haptic feedback:', error);
    }
  }
};

/**
 * Light vibration when selecting an emotion card
 * Provides subtle tactile confirmation of selection
 */
export const emotionSelectionHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.selection);
};

/**
 * Soft impulse when breathing phase changes (inhale → hold → exhale)
 * Uses light impact to not distract during exercise
 */
export const breathingPhaseChangeHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactLight);
};

/**
 * Medium impulse at the start of a new breathing cycle
 */
export const breathingCycleStartHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactMedium);
};

/**
 * Success haptic when exercise session is completed
 * Uses notification success for a satisfying completion feel
 */
export const sessionCompleteHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.notificationSuccess);
};

/**
 * Achievement unlocked haptic feedback
 * Uses notification success with a stronger feel
 */
export const achievementUnlockedHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.notificationSuccess);
};

/**
 * Light tap when pressing buttons or interactive elements
 */
export const buttonPressHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactLight);
};

/**
 * Medium impact for important actions (start/stop exercise)
 */
export const importantActionHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactMedium);
};

/**
 * Heavy impact for critical actions (e.g., stopping a session early)
 */
export const criticalActionHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactHeavy);
};

/**
 * Warning haptic for elevated stress levels or alerts
 */
export const warningHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.notificationWarning);
};

/**
 * Error haptic for failed operations
 */
export const errorHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.notificationError);
};

/**
 * Tab switch haptic feedback
 */
export const tabSwitchHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.selection);
};

/**
 * Haptic for exercise card selection in the exercise list
 */
export const exerciseCardSelectHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.selection);
};

/**
 * Timer tick haptic — used for countdown milestones (e.g., last 3 seconds)
 */
export const timerTickHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.impactLight);
};

/**
 * Haptic pattern for achievement unlock — double tap effect
 */
export const achievementCelebrationHaptic = (): void => {
  triggerHaptic(HapticFeedbackTypes.notificationSuccess);

  setTimeout(() => {
    triggerHaptic(HapticFeedbackTypes.impactHeavy);
  }, 200);

  setTimeout(() => {
    triggerHaptic(HapticFeedbackTypes.notificationSuccess);
  }, 500);
};

/**
 * Haptic pattern for session start countdown
 */
export const sessionStartCountdownHaptic = (secondsRemaining: number): void => {
  if (secondsRemaining <= 3 && secondsRemaining > 0) {
    triggerHaptic(HapticFeedbackTypes.impactMedium);
  } else if (secondsRemaining === 0) {
    triggerHaptic(HapticFeedbackTypes.notificationSuccess);
  }
};

export const Haptics = {
  emotionSelection: emotionSelectionHaptic,
  breathingPhaseChange: breathingPhaseChangeHaptic,
  breathingCycleStart: breathingCycleStartHaptic,
  sessionComplete: sessionCompleteHaptic,
  achievementUnlocked: achievementUnlockedHaptic,
  achievementCelebration: achievementCelebrationHaptic,
  buttonPress: buttonPressHaptic,
  importantAction: importantActionHaptic,
  criticalAction: criticalActionHaptic,
  warning: warningHaptic,
  error: errorHaptic,
  tabSwitch: tabSwitchHaptic,
  exerciseCardSelect: exerciseCardSelectHaptic,
  timerTick: timerTickHaptic,
  sessionStartCountdown: sessionStartCountdownHaptic,
} as const;

export default Haptics;