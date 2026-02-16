//
//  MeditationSessionFlowTests.swift
//  MindFlowUITests
//
//  Created by MindFlow Team
//  Copyright © 2024 MindFlow. All rights reserved.
//

import XCTest

final class MeditationSessionFlowTests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI-Testing"]
        app.launchEnvironment = [
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_ANON_KEY": "test_key",
            "SKIP_ONBOARDING": "true",
            "MOCK_AUTH": "true",
            "MOCK_HEALTH_DATA": "true"
        ]
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
        app = nil
    }
    
    // MARK: - Session Start Tests
    
    func testQuickStartMeditationFromHome() throws {
        // Given: User is on home screen
        let homeScreen = app.otherElements["HomeScreen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 5))
        
        // When: User taps quick start button
        let quickStartButton = app.buttons["QuickStartButton"]
        XCTAssertTrue(quickStartButton.exists)
        quickStartButton.tap()
        
        // Then: Meditation session screen appears
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.waitForExistence(timeout: 5))
        
        // And: Breathing animation is visible
        let breathingAnimation = app.otherElements["BreathingAnimation"]
        XCTAssertTrue(breathingAnimation.exists)
        
        // And: Session timer is running
        let sessionTimer = app.staticTexts["SessionTimer"]
        XCTAssertTrue(sessionTimer.exists)
    }
    
    func testStartMeditationWithExerciseSelection() throws {
        // Given: User is on home screen
        let homeScreen = app.otherElements["HomeScreen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 5))
        
        // When: User taps choose exercise button
        let chooseExerciseButton = app.buttons["ChooseExerciseButton"]
        XCTAssertTrue(chooseExerciseButton.exists)
        chooseExerciseButton.tap()
        
        // Then: Exercise selection screen appears
        let exerciseSelectionScreen = app.otherElements["ExerciseSelectionScreen"]
        XCTAssertTrue(exerciseSelectionScreen.waitForExistence(timeout: 5))
        
        // And: AI recommendation is visible
        let aiRecommendation = app.otherElements["AIRecommendedExercise"]
        XCTAssertTrue(aiRecommendation.exists)
        
        // When: User selects recommended exercise
        let recommendedExerciseCard = app.buttons["ExerciseCard_0"]
        XCTAssertTrue(recommendedExerciseCard.exists)
        recommendedExerciseCard.tap()
        
        // Then: Meditation session starts
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.waitForExistence(timeout: 5))
    }
    
    func testStartMeditationWithAlternativeExercise() throws {
        // Given: User is on exercise selection screen
        navigateToExerciseSelection()
        
        // When: User scrolls to alternative exercises
        let scrollView = app.scrollViews.firstMatch
        scrollView.swipeUp()
        
        // And: Selects alternative exercise
        let alternativeExercise = app.buttons["ExerciseCard_1"]
        XCTAssertTrue(alternativeExercise.waitForExistence(timeout: 3))
        alternativeExercise.tap()
        
        // Then: Meditation session starts with selected exercise
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.waitForExistence(timeout: 5))
        
        // And: Exercise name is displayed
        let exerciseName = app.staticTexts["ExerciseName"]
        XCTAssertTrue(exerciseName.exists)
    }
    
    func testAdaptiveSessionStartBasedOnStressLevel() throws {
        // Given: User has high stress level
        app.launchEnvironment["MOCK_STRESS_LEVEL"] = "8"
        app.terminate()
        app.launch()
        
        // When: User starts quick meditation
        let quickStartButton = app.buttons["QuickStartButton"]
        XCTAssertTrue(quickStartButton.waitForExistence(timeout: 5))
        quickStartButton.tap()
        
        // Then: Session starts immediately without preparation
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.waitForExistence(timeout: 2))
        
        // And: Breathing animation adapts to stress level
        let breathingAnimation = app.otherElements["BreathingAnimation"]
        XCTAssertTrue(breathingAnimation.exists)
    }
    
    func testSessionStartWithMediumStressPreparation() throws {
        // Given: User has medium stress level
        app.launchEnvironment["MOCK_STRESS_LEVEL"] = "5"
        app.terminate()
        app.launch()
        
        // When: User starts quick meditation
        let quickStartButton = app.buttons["QuickStartButton"]
        XCTAssertTrue(quickStartButton.waitForExistence(timeout: 5))
        quickStartButton.tap()
        
        // Then: Preparation screen appears
        let preparationScreen = app.otherElements["PreparationScreen"]
        XCTAssertTrue(preparationScreen.waitForExistence(timeout: 2))
        
        // And: Countdown timer shows 15 seconds
        let countdown = app.staticTexts["PreparationCountdown"]
        XCTAssertTrue(countdown.exists)
        
        // Wait for preparation to complete
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.waitForExistence(timeout: 16))
    }
    
    // MARK: - Session Interaction Tests
    
    func testBreathingAnimationDuringSession() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // Then: Breathing animation is visible and animating
        let breathingAnimation = app.otherElements["BreathingAnimation"]
        XCTAssertTrue(breathingAnimation.exists)
        
        // And: Breathing instructions are visible
        let breathingInstruction = app.staticTexts["BreathingInstruction"]
        XCTAssertTrue(breathingInstruction.exists)
        XCTAssertTrue(["Breathe In", "Hold", "Breathe Out"].contains(breathingInstruction.label))
    }
    
    func testSessionTimerCountdown() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // When: Session is running
        let sessionTimer = app.staticTexts["SessionTimer"]
        XCTAssertTrue(sessionTimer.exists)
        
        let initialTime = sessionTimer.label
        
        // Wait for 2 seconds
        sleep(2)
        
        // Then: Timer has decreased
        let updatedTime = sessionTimer.label
        XCTAssertNotEqual(initialTime, updatedTime)
    }
    
    func testPauseAndResumeSession() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // When: User taps pause button
        let pauseButton = app.buttons["PauseButton"]
        XCTAssertTrue(pauseButton.exists)
        pauseButton.tap()
        
        // Then: Session is paused
        let pausedIndicator = app.staticTexts["SessionPaused"]
        XCTAssertTrue(pausedIndicator.waitForExistence(timeout: 2))
        
        // And: Resume button appears
        let resumeButton = app.buttons["ResumeButton"]
        XCTAssertTrue(resumeButton.exists)
        
        // When: User resumes session
        resumeButton.tap()
        
        // Then: Session continues
        XCTAssertFalse(pausedIndicator.exists)
        let breathingAnimation = app.otherElements["BreathingAnimation"]
        XCTAssertTrue(breathingAnimation.exists)
    }
    
    func testSwitchExerciseDuringSession() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // When: User taps switch exercise button
        let switchButton = app.buttons["SwitchExerciseButton"]
        XCTAssertTrue(switchButton.exists)
        switchButton.tap()
        
        // Then: Exercise selection appears as overlay
        let exerciseOverlay = app.otherElements["ExerciseSelectionOverlay"]
        XCTAssertTrue(exerciseOverlay.waitForExistence(timeout: 2))
        
        // When: User selects different exercise
        let alternativeExercise = app.buttons["OverlayExerciseCard_1"]
        XCTAssertTrue(alternativeExercise.exists)
        alternativeExercise.tap()
        
        // Then: Session continues with new exercise
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.exists)
        
        // And: Exercise name is updated
        let exerciseName = app.staticTexts["ExerciseName"]
        XCTAssertTrue(exerciseName.exists)
    }
    
    func testEndSessionEarly() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // When: User taps end session button
        let endButton = app.buttons["EndSessionButton"]
        XCTAssertTrue(endButton.exists)
        endButton.tap()
        
        // Then: Confirmation alert appears
        let alert = app.alerts["End Session"]
        XCTAssertTrue(alert.waitForExistence(timeout: 2))
        
        // When: User confirms
        let confirmButton = alert.buttons["End"]
        confirmButton.tap()
        
        // Then: Session result screen appears
        let resultScreen = app.otherElements["SessionResultScreen"]
        XCTAssertTrue(resultScreen.waitForExistence(timeout: 3))
    }
    
    func testCancelEndSessionEarly() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // When: User taps end session button
        let endButton = app.buttons["EndSessionButton"]
        XCTAssertTrue(endButton.exists)
        endButton.tap()
        
        // Then: Confirmation alert appears
        let alert = app.alerts["End Session"]
        XCTAssertTrue(alert.waitForExistence(timeout: 2))
        
        // When: User cancels
        let cancelButton = alert.buttons["Cancel"]
        cancelButton.tap()
        
        // Then: Session continues
        let sessionScreen = app.otherElements["MeditationSessionScreen"]
        XCTAssertTrue(sessionScreen.exists)
    }
    
    // MARK: - Session Completion Tests
    
    func testCompleteFullSession() throws {
        // Given: User is in meditation session with short duration
        app.launchEnvironment["MOCK_SESSION_DURATION"] = "5"
        app.terminate()
        app.launch()
        
        startMeditationSession()
        
        // When: Session completes
        let resultScreen = app.otherElements["SessionResultScreen"]
        XCTAssertTrue(resultScreen.waitForExistence(timeout: 10))
        
        // Then: Result screen shows stress reduction
        let stressBefore = app.staticTexts["StressBefore"]
        let stressAfter = app.staticTexts["StressAfter"]
        XCTAssertTrue(stressBefore.exists)
        XCTAssertTrue(stressAfter.exists)
        
        // And: Completion message is visible
        let completionMessage = app.staticTexts["CompletionMessage"]
        XCTAssertTrue(completionMessage.exists)
    }
    
    func testRateSessionOnCompletion() throws {
        // Given: User completed session
        completeSession()
        
        // When: User taps rate button
        let rateButton = app.buttons["RateSessionButton"]
        XCTAssertTrue(rateButton.exists)
        rateButton.tap()
        
        // Then: Rating view appears
        let ratingView = app.otherElements["RatingView"]
        XCTAssertTrue(ratingView.waitForExistence(timeout: 2))
        
        // When: User selects 5 stars
        let fiveStarButton = app.buttons["RatingStar_5"]
        XCTAssertTrue(fiveStarButton.exists)
        fiveStarButton.tap()
        
        // Then: Rating is submitted
        let submitButton = app.buttons["SubmitRatingButton"]
        XCTAssertTrue(submitButton.exists)
        submitButton.tap()
        
        // And: Returns to home screen
        let homeScreen = app.otherElements["HomeScreen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 3))
    }
    
    func testViewNextRecommendedPractice() throws {
        // Given: User completed session
        completeSession()
        
        // When: User taps next practice button
        let nextPracticeButton = app.buttons["NextPracticeButton"]
        XCTAssertTrue(nextPracticeButton.exists)
        nextPracticeButton.tap()
        
        // Then: Exercise selection screen appears with recommendation
        let exerciseScreen = app.otherElements["ExerciseSelectionScreen"]
        XCTAssertTrue(exerciseScreen.waitForExistence(timeout: 3))
        
        let aiRecommendation = app.otherElements["AIRecommendedExercise"]
        XCTAssertTrue(aiRecommendation.exists)
    }
    
    func testShareSessionResults() throws {
        // Given: User completed session
        completeSession()
        
        // When: User taps share button
        let shareButton = app.buttons["ShareResultsButton"]
        XCTAssertTrue(shareButton.exists)
        shareButton.tap()
        
        // Then: Share sheet appears
        let shareSheet = app.otherElements["ActivityListView"]
        XCTAssertTrue(shareSheet.waitForExistence(timeout: 3))
    }
    
    func testReturnToHomeAfterSession() throws {
        // Given: User completed session
        completeSession()
        
        // When: User taps done button
        let doneButton = app.buttons["DoneButton"]
        XCTAssertTrue(doneButton.exists)
        doneButton.tap()
        
        // Then: Returns to home screen
        let homeScreen = app.otherElements["HomeScreen"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 3))
        
        // And: Updated stress level is visible
        let stressIndicator = app.otherElements["StressIndicator"]
        XCTAssertTrue(stressIndicator.exists)
    }
    
    // MARK: - Audio Playback Tests
    
    func testAudioPlaybackDuringSession() throws {
        // Given: User is in meditation session
        startMeditationSession()
        
        // Then: Audio controls are visible
        let audioToggle = app.buttons["AudioToggleButton"]
        XCTAssertTrue(audioToggle.exists)
        
        // When: User mutes audio
        audioToggle.tap()