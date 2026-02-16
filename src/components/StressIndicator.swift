import SwiftUI

struct StressIndicator: View {
    let stressLevel: Int
    let animated: Bool
    let showLabel: Bool
    let size: CGFloat
    
    @State private var animationProgress: CGFloat = 0
    
    init(
        stressLevel: Int,
        animated: Bool = true,
        showLabel: Bool = true,
        size: CGFloat = 120
    ) {
        self.stressLevel = min(max(stressLevel, 0), 100)
        self.animated = animated
        self.showLabel = showLabel
        self.size = size
    }
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .stroke(
                        stressColor.opacity(0.2),
                        lineWidth: size * 0.1
                    )
                    .frame(width: size, height: size)
                
                Circle()
                    .trim(from: 0, to: animationProgress)
                    .stroke(
                        stressGradient,
                        style: StrokeStyle(
                            lineWidth: size * 0.1,
                            lineCap: .round
                        )
                    )
                    .frame(width: size, height: size)
                    .rotationEffect(.degrees(-90))
                    .animation(
                        animated ? .spring(response: 1.2, dampingFraction: 0.8) : .none,
                        value: animationProgress
                    )
                
                VStack(spacing: 4) {
                    Text("\(Int(animationProgress * 100))")
                        .font(.system(size: size * 0.3, weight: .bold, design: .rounded))
                        .foregroundColor(stressColor)
                    
                    if showLabel {
                        Text(stressLevelText)
                            .font(.system(size: size * 0.12, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            if showLabel {
                HStack(spacing: 4) {
                    Circle()
                        .fill(stressColor)
                        .frame(width: 8, height: 8)
                        .scaleEffect(animated ? 1.0 : 0.8)
                        .animation(
                            animated ? .easeInOut(duration: 1.0).repeatForever(autoreverses: true) : .none,
                            value: animated
                        )
                    
                    Text(stressDescription)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)
                }
            }
        }
        .onAppear {
            if animated {
                withAnimation(.spring(response: 1.2, dampingFraction: 0.8).delay(0.2)) {
                    animationProgress = CGFloat(stressLevel) / 100.0
                }
            } else {
                animationProgress = CGFloat(stressLevel) / 100.0
            }
        }
        .onChange(of: stressLevel) { newValue in
            if animated {
                withAnimation(.spring(response: 1.0, dampingFraction: 0.8)) {
                    animationProgress = CGFloat(newValue) / 100.0
                }
            } else {
                animationProgress = CGFloat(newValue) / 100.0
            }
        }
    }
    
    private var stressColor: Color {
        switch stressLevel {
        case 0...20:
            return Color(red: 0.2, green: 0.8, blue: 0.6)
        case 21...40:
            return Color(red: 0.4, green: 0.8, blue: 0.4)
        case 41...60:
            return Color(red: 0.9, green: 0.8, blue: 0.3)
        case 61...80:
            return Color(red: 0.95, green: 0.6, blue: 0.3)
        default:
            return Color(red: 0.95, green: 0.4, blue: 0.4)
        }
    }
    
    private var stressGradient: AngularGradient {
        let colors: [Color]
        
        switch stressLevel {
        case 0...20:
            colors = [
                Color(red: 0.2, green: 0.8, blue: 0.6),
                Color(red: 0.3, green: 0.85, blue: 0.65)
            ]
        case 21...40:
            colors = [
                Color(red: 0.4, green: 0.8, blue: 0.4),
                Color(red: 0.5, green: 0.85, blue: 0.5)
            ]
        case 41...60:
            colors = [
                Color(red: 0.9, green: 0.8, blue: 0.3),
                Color(red: 0.95, green: 0.85, blue: 0.4)
            ]
        case 61...80:
            colors = [
                Color(red: 0.95, green: 0.6, blue: 0.3),
                Color(red: 1.0, green: 0.65, blue: 0.4)
            ]
        default:
            colors = [
                Color(red: 0.95, green: 0.4, blue: 0.4),
                Color(red: 1.0, green: 0.45, blue: 0.45)
            ]
        }
        
        return AngularGradient(
            colors: colors,
            center: .center,
            startAngle: .degrees(0),
            endAngle: .degrees(360)
        )
    }
    
    private var stressLevelText: String {
        switch stressLevel {
        case 0...20:
            return "Calm"
        case 21...40:
            return "Relaxed"
        case 41...60:
            return "Moderate"
        case 61...80:
            return "Elevated"
        default:
            return "High"
        }
    }
    
    private var stressDescription: String {
        switch stressLevel {
        case 0...20:
            return "You're doing great"
        case 21...40:
            return "Feeling balanced"
        case 41...60:
            return "Some tension detected"
        case 61...80:
            return "Consider a break"
        default:
            return "Time to breathe"
        }
    }
}

struct StressIndicatorCompact: View {
    let stressLevel: Int
    let size: CGFloat
    
    init(stressLevel: Int, size: CGFloat = 40) {
        self.stressLevel = min(max(stressLevel, 0), 100)
        self.size = size
    }
    
    var body: some View {
        ZStack {
            Circle()
                .fill(stressColor.opacity(0.2))
                .frame(width: size, height: size)
            
            Circle()
                .trim(from: 0, to: CGFloat(stressLevel) / 100.0)
                .stroke(
                    stressColor,
                    style: StrokeStyle(
                        lineWidth: size * 0.15,
                        lineCap: .round
                    )
                )
                .frame(width: size * 0.85, height: size * 0.85)
                .rotationEffect(.degrees(-90))
            
            Text("\(stressLevel)")
                .font(.system(size: size * 0.35, weight: .semibold, design: .rounded))
                .foregroundColor(stressColor)
        }
    }
    
    private var stressColor: Color {
        switch stressLevel {
        case 0...20:
            return Color(red: 0.2, green: 0.8, blue: 0.6)
        case 21...40:
            return Color(red: 0.4, green: 0.8, blue: 0.4)
        case 41...60:
            return Color(red: 0.9, green: 0.8, blue: 0.3)
        case 61...80:
            return Color(red: 0.95, green: 0.6, blue: 0.3)
        default:
            return Color(red: 0.95, green: 0.4, blue: 0.4)
        }
    }
}

struct StressIndicatorBar: View {
    let stressLevel: Int
    let height: CGFloat
    
    @State private var animationProgress: CGFloat = 0
    
    init(stressLevel: Int, height: CGFloat = 8) {
        self.stressLevel = min(max(stressLevel, 0), 100)
        self.height = height
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.gray.opacity(0.15))
                    .frame(height: height)
                
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(stressGradient)
                    .frame(width: geometry.size.width * animationProgress, height: height)
                    .animation(.spring(response: 1.0, dampingFraction: 0.8), value: animationProgress)
            }
        }
        .frame(height: height)
        .onAppear {
            withAnimation(.spring(response: 1.0, dampingFraction: 0.8).delay(0.2)) {
                animationProgress = CGFloat(stressLevel) / 100.0
            }
        }
        .onChange(of: stressLevel) { newValue in
            withAnimation(.spring(response: 0.8, dampingFraction: 0.8)) {
                animationProgress = CGFloat(newValue) / 100.0
            }
        }
    }
    
    private var stressGradient: LinearGradient {
        let colors: [Color]
        
        switch stressLevel {
        case 0...20:
            colors = [
                Color(red: 0.2, green: 0.8, blue: 0.6),
                Color(red: 0.3, green: 0.85, blue: 0.65)
            ]
        case 21...40:
            colors = [
                Color(red: 0.4, green: 0.8, blue: 0.4),
                Color(red: 0.5, green: 0.85, blue: 0.5)
            ]
        case 41...60:
            colors = [
                Color(red: 0.9, green: 0.8, blue: 0.3),
                Color(red: 0.95, green: 0.85, blue: 0.4)
            ]
        case 61...80:
            colors = [
                Color(red: 0.95, green: 0.6, blue: 0.3),
                Color(red: 1.0, green: 0.65, blue: 0.4)
            ]
        default:
            colors = [
                Color(red: 0.95, green: 0.4, blue: 0.4),
                Color(red: 1.0, green: 0.45, blue: 0.45)
            ]
        }
        
        return LinearGradient(
            colors: colors,
            startPoint: .leading,
            endPoint: .trailing
        )
    }
}

#Preview("Default Indicator") {
    VStack(spacing: 40) {
        StressIndicator(stressLevel: 25)
        StressIndicator(stressLevel: 50)
        StressIndicator(stressLevel: 85)
    }
    .padding()
}

#Preview("Compact Indicator") {
    HStack(spacing: 20) {
        StressIndicatorCompact(stressLevel: 25)
        StressIndicatorCompact(stressLevel: 50)
        StressIndicatorCompact(stressLevel: 85)
    }
    .padding()
}

#Preview("Bar Indicator") {
    VStack(spacing: 20) {
        StressIndicatorBar(stressLevel: 25)
        StressIndicatorBar(stressLevel: 50)
        StressIndicatorBar(stressLevel: 85)
    }
    .padding()
}