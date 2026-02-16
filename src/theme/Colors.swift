import SwiftUI

struct AppColors {
    // MARK: - Primary Colors
    static let background = Color.white
    static let surface = Color(hex: "#F8F9FA")
    static let surfaceElevated = Color(hex: "#FFFFFF")
    
    // MARK: - Brand Colors
    static let primary = Color(hex: "#6B9BD1")
    static let primaryLight = Color(hex: "#A8C7E7")
    static let primaryDark = Color(hex: "#4A7BA7")
    
    static let secondary = Color(hex: "#7BC4A3")
    static let secondaryLight = Color(hex: "#A8DCC4")
    static let secondaryDark = Color(hex: "#5A9B7E")
    
    static let accent = Color(hex: "#E8A87C")
    static let accentLight = Color(hex: "#F5C9A8")
    static let accentDark = Color(hex: "#D18A5A")
    
    // MARK: - Stress Level Colors
    static let stressLow = Color(hex: "#7BC4A3")
    static let stressMedium = Color(hex: "#F5C97A")
    static let stressHigh = Color(hex: "#E89B87")
    static let stressCritical = Color(hex: "#D17A7A")
    
    // MARK: - Text Colors
    static let textPrimary = Color(hex: "#1A1A1A")
    static let textSecondary = Color(hex: "#6B6B6B")
    static let textTertiary = Color(hex: "#9B9B9B")
    static let textDisabled = Color(hex: "#C4C4C4")
    static let textOnPrimary = Color.white
    static let textOnDark = Color.white
    
    // MARK: - Border Colors
    static let border = Color(hex: "#E5E5E5")
    static let borderLight = Color(hex: "#F0F0F0")
    static let borderDark = Color(hex: "#D0D0D0")
    static let divider = Color(hex: "#EBEBEB")
    
    // MARK: - State Colors
    static let success = Color(hex: "#7BC4A3")
    static let warning = Color(hex: "#F5C97A")
    static let error = Color(hex: "#E89B87")
    static let info = Color(hex: "#6B9BD1")
    
    // MARK: - Overlay Colors
    static let overlay = Color.black.opacity(0.5)
    static let overlayLight = Color.black.opacity(0.3)
    static let overlayDark = Color.black.opacity(0.7)
    
    // MARK: - Shadow Colors
    static let shadow = Color.black.opacity(0.08)
    static let shadowLight = Color.black.opacity(0.04)
    static let shadowDark = Color.black.opacity(0.12)
    
    // MARK: - Meditation Colors
    static let breathingCircle = Color(hex: "#6B9BD1").opacity(0.3)
    static let breathingCircleActive = Color(hex: "#6B9BD1").opacity(0.6)
    static let meditationBackground = Color(hex: "#F8F9FA")
    static let timerProgress = Color(hex: "#6B9BD1")
    static let timerTrack = Color(hex: "#E5E5E5")
    
    // MARK: - Achievement Colors
    static let achievementGold = Color(hex: "#F5C97A")
    static let achievementSilver = Color(hex: "#C4C4C4")
    static let achievementBronze = Color(hex: "#D18A5A")
    static let achievementLocked = Color(hex: "#E5E5E5")
    
    // MARK: - Chart Colors
    static let chartPrimary = Color(hex: "#6B9BD1")
    static let chartSecondary = Color(hex: "#7BC4A3")
    static let chartTertiary = Color(hex: "#E8A87C")
    static let chartBackground = Color(hex: "#F8F9FA")
    static let chartGrid = Color(hex: "#E5E5E5")
    
    // MARK: - Gradient Colors
    static let gradientStart = Color(hex: "#6B9BD1")
    static let gradientEnd = Color(hex: "#7BC4A3")
    
    static let meditationGradientStart = Color(hex: "#A8C7E7")
    static let meditationGradientEnd = Color(hex: "#A8DCC4")
    
    static let stressGradientLow = [Color(hex: "#7BC4A3"), Color(hex: "#A8DCC4")]
    static let stressGradientMedium = [Color(hex: "#F5C97A"), Color(hex: "#F5D9A8")]
    static let stressGradientHigh = [Color(hex: "#E89B87"), Color(hex: "#F5C9A8")]
    static let stressGradientCritical = [Color(hex: "#D17A7A"), Color(hex: "#E89B87")]
    
    // MARK: - Voice Selection Colors
    static let voiceSelected = Color(hex: "#6B9BD1")
    static let voiceUnselected = Color(hex: "#E5E5E5")
    static let voicePreviewActive = Color(hex: "#7BC4A3")
    
    // MARK: - Progress Colors
    static let progressTrack = Color(hex: "#E5E5E5")
    static let progressFill = Color(hex: "#6B9BD1")
    static let streakActive = Color(hex: "#F5C97A")
    static let streakInactive = Color(hex: "#E5E5E5")
    
    // MARK: - Notification Colors
    static let notificationBackground = Color(hex: "#FFFFFF")
    static let notificationBorder = Color(hex: "#E5E5E5")
    static let notificationAccent = Color(hex: "#6B9BD1")
    
    // MARK: - Widget Colors
    static let widgetBackground = Color(hex: "#F8F9FA")
    static let widgetAccent = Color(hex: "#6B9BD1")
    static let widgetText = Color(hex: "#1A1A1A")
    static let widgetSecondaryText = Color(hex: "#6B6B6B")
    
    // MARK: - Helper Methods
    static func stressColor(for level: Int) -> Color {
        switch level {
        case 0...3:
            return stressLow
        case 4...6:
            return stressMedium
        case 7...8:
            return stressHigh
        case 9...10:
            return stressCritical
        default:
            return stressMedium
        }
    }
    
    static func stressGradient(for level: Int) -> [Color] {
        switch level {
        case 0...3:
            return stressGradientLow
        case 4...6:
            return stressGradientMedium
        case 7...8:
            return stressGradientHigh
        case 9...10:
            return stressGradientCritical
        default:
            return stressGradientMedium
        }
    }
    
    static func adaptiveColor(light: Color, dark: Color) -> Color {
        return Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}

// MARK: - Color Extension for Hex Support
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    func toHex() -> String? {
        guard let components = UIColor(self).cgColor.components, components.count >= 3 else {
            return nil
        }
        
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        
        return String(format: "#%02lX%02lX%02lX",
                     lroundf(r * 255),
                     lroundf(g * 255),
                     lroundf(b * 255))
    }
}

// MARK: - Semantic Color Tokens
extension AppColors {
    struct Semantic {
        // Backgrounds
        static let backgroundPrimary = AppColors.background
        static let backgroundSecondary = AppColors.surface
        static let backgroundTertiary = AppColors.surfaceElevated
        
        // Interactive Elements
        static let buttonPrimary = AppColors.primary
        static let buttonSecondary = AppColors.secondary
        static let buttonDisabled = AppColors.textDisabled
        
        // Feedback
        static let feedbackSuccess = AppColors.success
        static let feedbackWarning = AppColors.warning
        static let feedbackError = AppColors.error
        static let feedbackInfo = AppColors.info
        
        // Content
        static let contentPrimary = AppColors.textPrimary
        static let contentSecondary = AppColors.textSecondary
        static let contentTertiary = AppColors.textTertiary
        static let contentDisabled = AppColors.textDisabled
    }
}

// MARK: - Dark Mode Support (Optional)
extension AppColors {
    struct Dark {
        static let background = Color(hex: "#1A1A1A")
        static let surface = Color(hex: "#2A2A2A")
        static let surfaceElevated = Color(hex: "#3A3A3A")
        
        static let primary = Color(hex: "#A8C7E7")
        static let secondary = Color(hex: "#A8DCC4")
        static let accent = Color(hex: "#F5C9A8")
        
        static let textPrimary = Color(hex: "#F8F9FA")
        static let textSecondary = Color(hex: "#C4C4C4")
        static let textTertiary = Color(hex: "#9B9B9B")
        
        static let border = Color(hex: "#3A3A3A")
        static let divider = Color(hex: "#2A2A2A")
    }
}