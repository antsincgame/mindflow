import SwiftUI

struct SessionTimer: View {
    let duration: TimeInterval
    let elapsed: TimeInterval
    let isActive: Bool
    
    private var progress: Double {
        guard duration > 0 else { return 0 }
        return min(elapsed / duration, 1.0)
    }
    
    private var remainingTime: TimeInterval {
        max(duration - elapsed, 0)
    }
    
    private var formattedTime: String {
        let minutes = Int(remainingTime) / 60
        let seconds = Int(remainingTime) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(
                    Color.secondary.opacity(0.2),
                    lineWidth: 8
                )
            
            // Progress circle
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color("Primary"),
                            Color("Secondary")
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(
                        lineWidth: 8,
                        lineCap: .round
                    )
                )
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 0.5), value: progress)
            
            // Time text
            VStack(spacing: 8) {
                Text(formattedTime)
                    .font(.system(size: 48, weight: .thin, design: .rounded))
                    .foregroundColor(.primary)
                    .monospacedDigit()
                
                if isActive {
                    Text("remaining")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                        .tracking(1)
                }
            }
            
            // Pulse animation when active
            if isActive {
                Circle()
                    .stroke(Color("Primary").opacity(0.3), lineWidth: 2)
                    .scaleEffect(pulseScale)
                    .opacity(pulseOpacity)
            }
        }
        .frame(width: 240, height: 240)
    }
    
    @State private var pulseScale: CGFloat = 1.0
    @State private var pulseOpacity: Double = 0.0
    
    private var pulseAnimation: Animation {
        Animation
            .easeInOut(duration: 2.0)
            .repeatForever(autoreverses: false)
    }
    
    init(duration: TimeInterval, elapsed: TimeInterval, isActive: Bool = true) {
        self.duration = duration
        self.elapsed = elapsed
        self.isActive = isActive
        
        if isActive {
            _pulseScale = State(initialValue: 1.0)
            _pulseOpacity = State(initialValue: 0.8)
        }
    }
}

extension SessionTimer {
    func onAppear() -> some View {
        self.modifier(PulseModifier(isActive: isActive))
    }
}

private struct PulseModifier: ViewModifier {
    let isActive: Bool
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.0
    
    func body(content: Content) -> some View {
        content
            .onAppear {
                guard isActive else { return }
                withAnimation(
                    .easeInOut(duration: 2.0)
                    .repeatForever(autoreverses: false)
                ) {
                    scale = 1.15
                    opacity = 0.0
                }
            }
    }
}

struct SessionTimer_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 40) {
            // Active timer
            SessionTimer(
                duration: 300,
                elapsed: 120,
                isActive: true
            )
            
            // Paused timer
            SessionTimer(
                duration: 300,
                elapsed: 120,
                isActive: false
            )
            
            // Almost complete
            SessionTimer(
                duration: 300,
                elapsed: 280,
                isActive: true
            )
        }
        .padding()
        .previewLayout(.sizeThatFits)
    }
}