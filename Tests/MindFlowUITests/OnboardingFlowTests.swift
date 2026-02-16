import XCTest

final class OnboardingFlowTests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["UI-Testing"]
        app.launchEnvironment = ["RESET_USER_DEFAULTS": "1"]
    }
    
    override func tearDownWithError() throws {
        app = nil
    }
    
    // MARK: - Complete Onboarding Flow Tests
    
    func testCompleteOnboardingFlow_WithAllPermissions() throws {
        app.launch()
        
        // Verify welcome screen appears
        XCTAssertTrue(app.staticTexts["Welcome to MindFlow"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Your personal stress management companion"].exists)
        
        // Tap Get Started button
        app.buttons["Get Started"].tap()
        
        // Verify permissions introduction screen
        XCTAssertTrue(app.staticTexts["We need a few permissions"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["To provide personalized stress management"].exists)
        
        // Tap Continue to permissions
        app.buttons["Continue"].tap()
        
        // HealthKit permission screen
        XCTAssertTrue(app.staticTexts["Enable HealthKit"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Track your heart rate and activity"].exists)
        app.buttons["Enable HealthKit"].tap()
        
        // Handle system HealthKit permission alert
        let healthKitAlert = app.alerts.firstMatch
        if healthKitAlert.waitForExistence(timeout: 5) {
            healthKitAlert.buttons["Allow"].tap()
        }
        
        // Calendar permission screen
        XCTAssertTrue(app.staticTexts["Enable Calendar Access"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Detect stressful events in your schedule"].exists)
        app.buttons["Enable Calendar"].tap()
        
        // Handle system Calendar permission alert
        let calendarAlert = app.alerts.firstMatch
        if calendarAlert.waitForExistence(timeout: 5) {
            calendarAlert.buttons["OK"].tap()
        }
        
        // Notifications permission screen
        XCTAssertTrue(app.staticTexts["Enable Notifications"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Get timely reminders to meditate"].exists)
        app.buttons["Enable Notifications"].tap()
        
        // Handle system Notifications permission alert
        let notificationAlert = app.alerts.firstMatch
        if notificationAlert.waitForExistence(timeout: 5) {
            notificationAlert.buttons["Allow"].tap()
        }
        
        // Voice selection screen
        XCTAssertTrue(app.staticTexts["Choose Your Instructor Voice"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Select a voice that resonates with you"].exists)
        
        // Verify voice options are displayed
        XCTAssertTrue(app.buttons["Female Voice - Calm"].exists)
        XCTAssertTrue(app.buttons["Male Voice - Gentle"].exists)
        
        // Play preview
        app.buttons["Play Preview-Female Voice - Calm"].tap()
        sleep(2)
        app.buttons["Stop Preview-Female Voice - Calm"].tap()
        
        // Select voice
        app.buttons["Female Voice - Calm"].tap()
        
        // Tap Continue
        app.buttons["Continue"].tap()
        
        // Optional microphone permission screen
        XCTAssertTrue(app.staticTexts["Personalize Your Voice"].waitForExistence(timeout: 2))
        app.buttons["Skip for Now"].tap()
        
        // Session interval selection screen
        XCTAssertTrue(app.staticTexts["Set Session Interval"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["How often would you like meditation reminders?"].exists)
        
        // Select 4 hours interval
        app.buttons["4 hours"].tap()
        app.buttons["Continue"].tap()
        
        // Final onboarding screen
        XCTAssertTrue(app.staticTexts["You're All Set!"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Start your mindfulness journey"].exists)
        app.buttons["Start Meditating"].tap()
        
        // Verify navigation to Home screen
        XCTAssertTrue(app.staticTexts["Home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Quick Start Meditation"].exists)
    }
    
    func testOnboardingFlow_SkipAllPermissions() throws {
        app.launch()
        
        app.buttons["Get Started"].waitForExistence(timeout: 5)
        app.buttons["Get Started"].tap()
        
        app.buttons["Continue"].waitForExistence(timeout: 2)
        app.buttons["Continue"].tap()
        
        // Skip HealthKit
        app.buttons["Skip for Now"].waitForExistence(timeout: 2)
        app.buttons["Skip for Now"].tap()
        
        // Skip Calendar
        app.buttons["Skip for Now"].waitForExistence(timeout: 2)
        app.buttons["Skip for Now"].tap()
        
        // Skip Notifications
        app.buttons["Skip for Now"].waitForExistence(timeout: 2)
        app.buttons["Skip for Now"].tap()
        
        // Select voice
        app.buttons["Male Voice - Gentle"].waitForExistence(timeout: 2)
        app.buttons["Male Voice - Gentle"].tap()
        app.buttons["Continue"].tap()
        
        // Skip microphone
        app.buttons["Skip for Now"].waitForExistence(timeout: 2)
        app.buttons["Skip for Now"].tap()
        
        // Select interval
        app.buttons["2 hours"].waitForExistence(timeout: 2)
        app.buttons["2 hours"].tap()
        app.buttons["Continue"].tap()
        
        // Complete onboarding
        app.buttons["Start Meditating"].waitForExistence(timeout: 2)
        app.buttons["Start Meditating"].tap()
        
        // Verify Home screen
        XCTAssertTrue(app.staticTexts["Home"].waitForExistence(timeout: 5))
    }
    
    // MARK: - Individual Screen Tests
    
    func testWelcomeScreen_ElementsExist() throws {
        app.launch()
        
        XCTAssertTrue(app.staticTexts["Welcome to MindFlow"].exists)
        XCTAssertTrue(app.staticTexts["Your personal stress management companion"].exists)
        XCTAssertTrue(app.buttons["Get Started"].exists)
        XCTAssertTrue(app.images["Onboarding Illustration"].exists)
    }
    
    func testPermissionsIntroScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        
        XCTAssertTrue(app.staticTexts["We need a few permissions"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["To provide personalized stress management"].exists)
        XCTAssertTrue(app.staticTexts["HealthKit"].exists)
        XCTAssertTrue(app.staticTexts["Track heart rate and activity"].exists)
        XCTAssertTrue(app.staticTexts["Calendar"].exists)
        XCTAssertTrue(app.staticTexts["Detect stressful events"].exists)
        XCTAssertTrue(app.staticTexts["Notifications"].exists)
        XCTAssertTrue(app.staticTexts["Timely meditation reminders"].exists)
        XCTAssertTrue(app.buttons["Continue"].exists)
    }
    
    func testHealthKitPermissionScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        
        XCTAssertTrue(app.staticTexts["Enable HealthKit"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Track your heart rate and activity"].exists)
        XCTAssertTrue(app.staticTexts["We use this data to detect stress patterns"].exists)
        XCTAssertTrue(app.buttons["Enable HealthKit"].exists)
        XCTAssertTrue(app.buttons["Skip for Now"].exists)
        XCTAssertTrue(app.images["HealthKit Icon"].exists)
    }
    
    func testCalendarPermissionScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        
        XCTAssertTrue(app.staticTexts["Enable Calendar Access"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Detect stressful events in your schedule"].exists)
        XCTAssertTrue(app.staticTexts["We analyze your calendar to predict stress"].exists)
        XCTAssertTrue(app.buttons["Enable Calendar"].exists)
        XCTAssertTrue(app.buttons["Skip for Now"].exists)
        XCTAssertTrue(app.images["Calendar Icon"].exists)
    }
    
    func testNotificationsPermissionScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        
        XCTAssertTrue(app.staticTexts["Enable Notifications"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Get timely reminders to meditate"].exists)
        XCTAssertTrue(app.staticTexts["We'll notify you when we detect stress"].exists)
        XCTAssertTrue(app.buttons["Enable Notifications"].exists)
        XCTAssertTrue(app.buttons["Skip for Now"].exists)
        XCTAssertTrue(app.images["Notification Icon"].exists)
    }
    
    func testVoiceSelectionScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        
        XCTAssertTrue(app.staticTexts["Choose Your Instructor Voice"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Select a voice that resonates with you"].exists)
        XCTAssertTrue(app.buttons["Female Voice - Calm"].exists)
        XCTAssertTrue(app.buttons["Male Voice - Gentle"].exists)
        XCTAssertTrue(app.buttons["Female Voice - Energetic"].exists)
        XCTAssertTrue(app.buttons["Male Voice - Deep"].exists)
        XCTAssertTrue(app.buttons["Play Preview-Female Voice - Calm"].exists)
        XCTAssertTrue(app.buttons["Continue"].exists)
    }
    
    func testVoicePreview_PlayAndStop() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        
        let playButton = app.buttons["Play Preview-Female Voice - Calm"]
        XCTAssertTrue(playButton.waitForExistence(timeout: 2))
        playButton.tap()
        
        let stopButton = app.buttons["Stop Preview-Female Voice - Calm"]
        XCTAssertTrue(stopButton.waitForExistence(timeout: 2))
        stopButton.tap()
        
        XCTAssertTrue(playButton.exists)
    }
    
    func testVoiceSelection_SelectAndContinue() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        
        let voiceButton = app.buttons["Male Voice - Gentle"]
        XCTAssertTrue(voiceButton.waitForExistence(timeout: 2))
        voiceButton.tap()
        
        XCTAssertTrue(voiceButton.isSelected)
        
        let continueButton = app.buttons["Continue"]
        XCTAssertTrue(continueButton.isEnabled)
        continueButton.tap()
        
        XCTAssertTrue(app.staticTexts["Personalize Your Voice"].waitForExistence(timeout: 2))
    }
    
    func testMicrophonePermissionScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Female Voice - Calm"].tap()
        app.buttons["Continue"].tap()
        
        XCTAssertTrue(app.staticTexts["Personalize Your Voice"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Clone your voice for a personal touch"].exists)
        XCTAssertTrue(app.staticTexts["Optional: Record your voice to create a personalized instructor"].exists)
        XCTAssertTrue(app.buttons["Enable Microphone"].exists)
        XCTAssertTrue(app.buttons["Skip for Now"].exists)
        XCTAssertTrue(app.images["Microphone Icon"].exists)
    }
    
    func testSessionIntervalScreen_ElementsExist() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Female Voice - Calm"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        
        XCTAssertTrue(app.staticTexts["Set Session Interval"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["How often would you like meditation reminders?"].exists)
        XCTAssertTrue(app.buttons["1 hour"].exists)
        XCTAssertTrue(app.buttons["2 hours"].exists)
        XCTAssertTrue(app.buttons["4 hours"].exists)
        XCTAssertTrue(app.buttons["6 hours"].exists)
        XCTAssertTrue(app.buttons["8 hours"].exists)
        XCTAssertTrue(app.buttons["Continue"].exists)
    }
    
    func testSessionInterval_Selection() throws {
        app.launch()
        app.buttons["Get Started"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Skip for Now"].tap()
        app.buttons["Female Voice - Calm"].tap()
        app.buttons["Continue"].tap()
        app.buttons["Skip for Now"].tap()
        
        let interval2h = app.buttons["2 hours"]
        XCTAssertTrue(interval2h.waitForExistence(timeout: 2))
        interval2h.tap()
        XCTAssertTrue(interval2h.isSelected)
        
        let interval6h = app.buttons["6 hours"]
        interval6h.tap()
        XCTAssertTrue(