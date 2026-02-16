import SwiftUI

struct Typography {
    // MARK: - Font Families
    
    static let primaryFont = "SF Pro Display"
    static let secondaryFont = "SF Pro Text"
    
    // MARK: - Font Weights
    
    enum FontWeight {
        case light
        case regular
        case medium
        case semibold
        case bold
        
        var value: Font.Weight {
            switch self {
            case .light: return .light
            case .regular: return .regular
            case .medium: return .medium
            case .semibold: return .semibold
            case .bold: return .bold
            }
        }
    }
    
    // MARK: - Display Styles
    
    static func displayLarge(weight: FontWeight = .bold) -> Font {
        return .system(size: 57, weight: weight.value, design: .default)
    }
    
    static func displayMedium(weight: FontWeight = .bold) -> Font {
        return .system(size: 45, weight: weight.value, design: .default)
    }
    
    static func displaySmall(weight: FontWeight = .bold) -> Font {
        return .system(size: 36, weight: weight.value, design: .default)
    }
    
    // MARK: - Headline Styles
    
    static func headlineLarge(weight: FontWeight = .semibold) -> Font {
        return .system(size: 32, weight: weight.value, design: .default)
    }
    
    static func headlineMedium(weight: FontWeight = .semibold) -> Font {
        return .system(size: 28, weight: weight.value, design: .default)
    }
    
    static func headlineSmall(weight: FontWeight = .semibold) -> Font {
        return .system(size: 24, weight: weight.value, design: .default)
    }
    
    // MARK: - Title Styles
    
    static func titleLarge(weight: FontWeight = .medium) -> Font {
        return .system(size: 22, weight: weight.value, design: .default)
    }
    
    static func titleMedium(weight: FontWeight = .medium) -> Font {
        return .system(size: 20, weight: weight.value, design: .default)
    }
    
    static func titleSmall(weight: FontWeight = .medium) -> Font {
        return .system(size: 18, weight: weight.value, design: .default)
    }
    
    // MARK: - Body Styles
    
    static func bodyLarge(weight: FontWeight = .regular) -> Font {
        return .system(size: 17, weight: weight.value, design: .default)
    }
    
    static func bodyMedium(weight: FontWeight = .regular) -> Font {
        return .system(size: 15, weight: weight.value, design: .default)
    }
    
    static func bodySmall(weight: FontWeight = .regular) -> Font {
        return .system(size: 13, weight: weight.value, design: .default)
    }
    
    // MARK: - Label Styles
    
    static func labelLarge(weight: FontWeight = .medium) -> Font {
        return .system(size: 14, weight: weight.value, design: .default)
    }
    
    static func labelMedium(weight: FontWeight = .medium) -> Font {
        return .system(size: 12, weight: weight.value, design: .default)
    }
    
    static func labelSmall(weight: FontWeight = .medium) -> Font {
        return .system(size: 11, weight: weight.value, design: .default)
    }
    
    // MARK: - Caption Styles
    
    static func caption(weight: FontWeight = .regular) -> Font {
        return .system(size: 12, weight: weight.value, design: .default)
    }
    
    static func captionSmall(weight: FontWeight = .regular) -> Font {
        return .system(size: 10, weight: weight.value, design: .default)
    }
    
    // MARK: - Special Styles
    
    static func timer(weight: FontWeight = .light) -> Font {
        return .system(size: 72, weight: weight.value, design: .rounded)
    }
    
    static func stressLevel(weight: FontWeight = .semibold) -> Font {
        return .system(size: 48, weight: weight.value, design: .rounded)
    }
    
    static func button(weight: FontWeight = .semibold) -> Font {
        return .system(size: 17, weight: weight.value, design: .default)
    }
    
    static func buttonSmall(weight: FontWeight = .medium) -> Font {
        return .system(size: 15, weight: weight.value, design: .default)
    }
    
    static func navigationTitle(weight: FontWeight = .bold) -> Font {
        return .system(size: 34, weight: weight.value, design: .default)
    }
    
    static func tabBar(weight: FontWeight = .medium) -> Font {
        return .system(size: 10, weight: weight.value, design: .default)
    }
    
    // MARK: - Line Heights
    
    enum LineHeight {
        case tight
        case normal
        case relaxed
        case loose
        
        var value: CGFloat {
            switch self {
            case .tight: return 1.0
            case .normal: return 1.2
            case .relaxed: return 1.4
            case .loose: return 1.6
            }
        }
    }
    
    // MARK: - Letter Spacing
    
    enum LetterSpacing {
        case tight
        case normal
        case wide
        
        var value: CGFloat {
            switch self {
            case .tight: return -0.5
            case .normal: return 0
            case .wide: return 0.5
            }
        }
    }
    
    // MARK: - Text Styles
    
    struct TextStyle {
        let font: Font
        let lineHeight: LineHeight
        let letterSpacing: LetterSpacing
        let color: Color
        
        init(
            font: Font,
            lineHeight: LineHeight = .normal,
            letterSpacing: LetterSpacing = .normal,
            color: Color = .primary
        ) {
            self.font = font
            self.lineHeight = lineHeight
            self.letterSpacing = letterSpacing
            self.color = color
        }
    }
    
    // MARK: - Predefined Text Styles
    
    static let heroTitle = TextStyle(
        font: displayLarge(),
        lineHeight: .tight,
        letterSpacing: .tight
    )
    
    static let screenTitle = TextStyle(
        font: headlineLarge(),
        lineHeight: .normal,
        letterSpacing: .normal
    )
    
    static let sectionTitle = TextStyle(
        font: titleLarge(),
        lineHeight: .normal,
        letterSpacing: .normal
    )
    
    static let cardTitle = TextStyle(
        font: titleMedium(),
        lineHeight: .normal,
        letterSpacing: .normal
    )
    
    static let bodyText = TextStyle(
        font: bodyLarge(),
        lineHeight: .relaxed,
        letterSpacing: .normal
    )
    
    static let secondaryText = TextStyle(
        font: bodyMedium(),
        lineHeight: .normal,
        letterSpacing: .normal,
        color: .secondary
    )
    
    static let captionText = TextStyle(
        font: caption(),
        lineHeight: .normal,
        letterSpacing: .normal,
        color: .secondary
    )
    
    static let buttonText = TextStyle(
        font: button(),
        lineHeight: .tight,
        letterSpacing: .wide
    )
    
    static let timerText = TextStyle(
        font: timer(),
        lineHeight: .tight,
        letterSpacing: .tight
    )
    
    static let stressLevelText = TextStyle(
        font: stressLevel(),
        lineHeight: .tight,
        letterSpacing: .normal
    )
}

// MARK: - View Extensions

extension View {
    func textStyle(_ style: Typography.TextStyle) -> some View {
        self
            .font(style.font)
            .foregroundColor(style.color)
            .lineSpacing(style.lineHeight.value)
            .tracking(style.letterSpacing.value)
    }
    
    func displayLarge(weight: Typography.FontWeight = .bold) -> some View {
        self.font(Typography.displayLarge(weight: weight))
    }
    
    func displayMedium(weight: Typography.FontWeight = .bold) -> some View {
        self.font(Typography.displayMedium(weight: weight))
    }
    
    func displaySmall(weight: Typography.FontWeight = .bold) -> some View {
        self.font(Typography.displaySmall(weight: weight))
    }
    
    func headlineLarge(weight: Typography.FontWeight = .semibold) -> some View {
        self.font(Typography.headlineLarge(weight: weight))
    }
    
    func headlineMedium(weight: Typography.FontWeight = .semibold) -> some View {
        self.font(Typography.headlineMedium(weight: weight))
    }
    
    func headlineSmall(weight: Typography.FontWeight = .semibold) -> some View {
        self.font(Typography.headlineSmall(weight: weight))
    }
    
    func titleLarge(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.titleLarge(weight: weight))
    }
    
    func titleMedium(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.titleMedium(weight: weight))
    }
    
    func titleSmall(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.titleSmall(weight: weight))
    }
    
    func bodyLarge(weight: Typography.FontWeight = .regular) -> some View {
        self.font(Typography.bodyLarge(weight: weight))
    }
    
    func bodyMedium(weight: Typography.FontWeight = .regular) -> some View {
        self.font(Typography.bodyMedium(weight: weight))
    }
    
    func bodySmall(weight: Typography.FontWeight = .regular) -> some View {
        self.font(Typography.bodySmall(weight: weight))
    }
    
    func labelLarge(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.labelLarge(weight: weight))
    }
    
    func labelMedium(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.labelMedium(weight: weight))
    }
    
    func labelSmall(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.labelSmall(weight: weight))
    }
    
    func caption(weight: Typography.FontWeight = .regular) -> some View {
        self.font(Typography.caption(weight: weight))
    }
    
    func captionSmall(weight: Typography.FontWeight = .regular) -> some View {
        self.font(Typography.captionSmall(weight: weight))
    }
    
    func timer(weight: Typography.FontWeight = .light) -> some View {
        self.font(Typography.timer(weight: weight))
    }
    
    func stressLevel(weight: Typography.FontWeight = .semibold) -> some View {
        self.font(Typography.stressLevel(weight: weight))
    }
    
    func buttonText(weight: Typography.FontWeight = .semibold) -> some View {
        self.font(Typography.button(weight: weight))
    }
    
    func buttonTextSmall(weight: Typography.FontWeight = .medium) -> some View {
        self.font(Typography.buttonSmall(weight: weight))
    }
}

// MARK: - Text Extensions

extension Text {
    func textStyle(_ style: Typography.TextStyle) -> Text {
        self
            .font(style.font)
            .foregroundColor(style.color)
            .tracking(style.letterSpacing.value)
    }
    
    func lineHeight(_ height: Typography.LineHeight) -> some View {
        self.lineSpacing(height.value)
    }
    
    func letterSpacing(_ spacing: Typography.LetterSpacing) -> Text {
        self.tracking(spacing.value)
    }
}

// MARK: - Dynamic Type Support

extension Typography {
    static func scaledFont(
        _ baseFont: Font,
        relativeTo textStyle: Font.TextStyle = .body
    ) -> Font {
        return baseFont
    }
    
    static func accessibleFont(
        size: CGFloat,
        weight: FontWeight = .regular,
        relativeTo textStyle: Font.TextStyle = .body
    ) -> Font {
        return .system(size: size, weight: weight.value, design: .default)
    }
}

// MARK: - Accessibility

extension Typography {
    static var isAccessibilityCategory: Bool {
        let category = UIApplication.shared.preferredContentSizeCategory
        return category.isAccessibilityCategory
    }
    
    static func adjustedSize(
        _ baseSize: CGFloat,
        min: CGFloat? = nil,
        max: CGFloat? = nil
    ) -> CGFloat {
        let scaleFactor = UIFontMetrics.default.scaledValue(for: baseSize) / baseSize
        var adjustedSize = baseSize * scaleFactor
        
        if let min = min {
            adjustedSize = Swift.max(adjustedSize, min)
        }
        
        if let max = max {
            adjustedSize = Swift.min(adjustedSize, max)
        }
        
        return adjustedSize
    }
}