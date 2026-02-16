import SwiftUI

struct BreathingAnimation: View {
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.3
    @State private var rotationAngle: Double = 0
    @State private var timer: Timer?
    
    let stressLevel: Int
    let isActive: Bool
    let breathingPhase: BreathingPhase
    
    private var breathingDuration: Double {
        switch stressLevel {
        case 0...3:
            return 4.0
        case 4...6:
            return 3.5
        case 7...8:
            return 3.0
        default:
            return 2.5
        }
    }
    
    private var holdDuration: Double {
        breathingDuration * 0.5
    }
    
    private var maxScale: CGFloat {
        switch stressLevel {
        case 0...3:
            return 1.8
        case 4...6:
            return 1.6
        case 7...8:
            return 1.4
        default:
            return 1.3
        }
    }
    
    private var primaryColor: Color {
        switch stressLevel {
        case 0...3:
            return Color("Primary")
        case 4...6:
            return Color.blue.opacity(0.8)
        case 7...8:
            return Color.purple.opacity(0.7)
        default:
            return Color.red.opacity(0.6)
        }
    }
    
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [
                            primaryColor.opacity(0.6),
                            primaryColor.opacity(0.2),
                            Color.clear
                        ]),
                        center: .center,
                        startRadius: 0,
                        endRadius: 150
                    )
                )
                .frame(width: 200, height: 200)
                .scaleEffect(scale)
                .opacity(opacity)
                .blur(radius: 2)
            
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [
                            primaryColor.opacity(0.4),
                            primaryColor.opacity(0.1),
                            Color.clear
                        ]),
                        center: .center,
                        startRadius: 0,
                        endRadius: 120
                    )
                )
                .frame(width: 160, height: 160)
                .scaleEffect(scale * 0.9)
                .opacity(opacity * 0.8)
                .blur(radius: 1)
            
            Circle()
                .stroke(
                    primaryColor.opacity(0.3),
                    lineWidth: 2
                )
                .frame(width: 120, height: 120)
                .scaleEffect(scale * 0.8)
                .rotationEffect(.degrees(rotationAngle))
            
            Circle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            primaryColor,
                            primaryColor.opacity(0.7)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 80, height: 80)
                .scaleEffect(scale * 0.7)
                .shadow(color: primaryColor.opacity(0.5), radius: 10)
            
            VStack(spacing: 8) {
                Text(breathingPhase.title)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundColor(.white)
                    .shadow(color: .black.opacity(0.3), radius: 2)
                
                if breathingPhase != .hold {
                    Text(breathingPhase.instruction)
                        .font(.system(size: 12, weight: .regular, design: .rounded))
                        .foregroundColor(.white.opacity(0.9))
                        .shadow(color: .black.opacity(0.3), radius: 2)
                }
            }
            .scaleEffect(scale * 0.5 + 0.5)
            .opacity(isActive ? 1 : 0)
        }
        .onChange(of: isActive) { newValue in
            if newValue {
                startBreathing()
            } else {
                stopBreathing()
            }
        }
        .onAppear {
            if isActive {
                startBreathing()
            }
        }
        .onDisappear {
            stopBreathing()
        }
    }
    
    private func startBreathing() {
        performBreathingCycle()
    }
    
    private func stopBreathing() {
        timer?.invalidate()
        timer = nil
        withAnimation(.easeOut(duration: 0.5)) {
            scale = 1.0
            opacity = 0.3
            rotationAngle = 0
        }
    }
    
    private func performBreathingCycle() {
        inhale()
    }
    
    private func inhale() {
        withAnimation(.easeInOut(duration: breathingDuration)) {
            scale = maxScale
            opacity = 0.8
            rotationAngle += 120
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + breathingDuration) {
            guard isActive else { return }
            hold(afterInhale: true)
        }
    }
    
    private func hold(afterInhale: Bool) {
        withAnimation(.linear(duration: holdDuration)) {
            rotationAngle += 60
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + holdDuration) {
            guard isActive else { return }
            if afterInhale {
                exhale()
            } else {
                performBreathingCycle()
            }
        }
    }
    
    private func exhale() {
        withAnimation(.easeInOut(duration: breathingDuration)) {
            scale = 1.0
            opacity = 0.3
            rotationAngle += 120
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + breathingDuration) {
            guard isActive else { return }
            hold(afterInhale: false)
        }
    }
}

enum BreathingPhase {
    case inhale
    case hold
    case exhale
    
    var title: String {
        switch self {
        case .inhale:
            return "Вдох"
        case .hold:
            return "Задержка"
        case .exhale:
            return "Выдох"
        }
    }
    
    var instruction: String {
        switch self {
        case .inhale:
            return "Медленно вдыхайте"
        case .hold:
            return ""
        case .exhale:
            return "Медленно выдыхайте"
        }
    }
}

struct BreathingAnimation_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 40) {
                BreathingAnimation(
                    stressLevel: 2,
                    isActive: true,
                    breathingPhase: .inhale
                )
                
                Text("Низкий стресс (2)")
                    .foregroundColor(.white)
                
                BreathingAnimation(
                    stressLevel: 5,
                    isActive: true,
                    breathingPhase: .hold
                )
                
                Text("Средний стресс (5)")
                    .foregroundColor(.white)
                
                BreathingAnimation(
                    stressLevel: 9,
                    isActive: true,
                    breathingPhase: .exhale
                )
                
                Text("Высокий стресс (9)")
                    .foregroundColor(.white)
            }
        }
    }
}