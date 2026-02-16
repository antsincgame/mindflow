import SwiftUI
import Combine

struct SessionResultScreen: View {
    @StateObject private var viewModel: SessionResultViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showRatingView = false
    @State private var selectedRating: Int?
    @State private var showNextExerciseSheet = false
    @State private var animateStressChange = false
    
    init(sessionId: UUID) {
        _viewModel = StateObject(wrappedValue: SessionResultViewModel(sessionId: sessionId))
    }
    
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
            } else if let session = viewModel.session {
                ScrollView {
                    VStack(spacing: 32) {
                        // Header
                        VStack(spacing: 16) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 64))
                                .foregroundColor(.primary)
                                .scaleEffect(animateStressChange ? 1.0 : 0.5)
                                .opacity(animateStressChange ? 1.0 : 0.0)
                            
                            Text("Session Complete")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.text)
                            
                            Text(formatDuration(session.durationSeconds))
                                .font(.subheadline)
                                .foregroundColor(.textSecondary)
                        }
                        .padding(.top, 40)
                        
                        // Stress Comparison
                        stressComparisonView(
                            before: session.stressBefore,
                            after: session.stressAfter
                        )
                        
                        // Stats Cards
                        statsCardsView(session: session)
                        
                        // Rating Section
                        if session.rating == nil && !showRatingView {
                            ratingPromptView
                        } else if showRatingView {
                            ratingInputView
                        } else if let rating = session.rating {
                            ratingDisplayView(rating: rating)
                        }
                        
                        // Next Exercise Recommendation
                        if let recommendation = viewModel.nextExerciseRecommendation {
                            nextExerciseRecommendationView(recommendation: recommendation)
                        }
                        
                        // Action Buttons
                        actionButtonsView
                        
                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 24)
                }
            } else if let error = viewModel.error {
                errorView(error: error)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { dismiss() }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.text)
                }
            }
        }
        .sheet(isPresented: $showNextExerciseSheet) {
            if let recommendation = viewModel.nextExerciseRecommendation {
                ExerciseSelectionScreen(
                    recommendedExerciseId: recommendation.id,
                    onExerciseSelected: { exerciseId in
                        showNextExerciseSheet = false
                        viewModel.startNextSession(exerciseId: exerciseId)
                    }
                )
            }
        }
        .onAppear {
            viewModel.loadSessionResult()
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.3)) {
                animateStressChange = true
            }
        }
    }
    
    // MARK: - Stress Comparison View
    
    private func stressComparisonView(before: Int, after: Int) -> some View {
        VStack(spacing: 24) {
            Text("Stress Level")
                .font(.headline)
                .foregroundColor(.text)
            
            HStack(spacing: 40) {
                // Before
                VStack(spacing: 12) {
                    Text("Before")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                        .textCase(.uppercase)
                    
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                            .frame(width: 100, height: 100)
                        
                        Circle()
                            .trim(from: 0, to: animateStressChange ? CGFloat(before) / 10.0 : 0)
                            .stroke(
                                stressColor(for: before),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 1.0), value: animateStressChange)
                        
                        Text("\(before)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(stressColor(for: before))
                    }
                }
                
                // Arrow
                Image(systemName: "arrow.right")
                    .font(.title2)
                    .foregroundColor(.textSecondary)
                    .scaleEffect(animateStressChange ? 1.0 : 0.5)
                    .opacity(animateStressChange ? 1.0 : 0.0)
                    .animation(.spring(response: 0.5, dampingFraction: 0.6).delay(0.5), value: animateStressChange)
                
                // After
                VStack(spacing: 12) {
                    Text("After")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                        .textCase(.uppercase)
                    
                    ZStack {
                        Circle()
                            .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                            .frame(width: 100, height: 100)
                        
                        Circle()
                            .trim(from: 0, to: animateStressChange ? CGFloat(after) / 10.0 : 0)
                            .stroke(
                                stressColor(for: after),
                                style: StrokeStyle(lineWidth: 8, lineCap: .round)
                            )
                            .frame(width: 100, height: 100)
                            .rotationEffect(.degrees(-90))
                            .animation(.easeInOut(duration: 1.0).delay(0.3), value: animateStressChange)
                        
                        Text("\(after)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(stressColor(for: after))
                    }
                }
            }
            
            // Improvement Badge
            if before > after {
                let improvement = before - after
                let percentage = Int((Double(improvement) / Double(before)) * 100)
                
                HStack(spacing: 8) {
                    Image(systemName: "arrow.down.circle.fill")
                        .foregroundColor(.secondary)
                    Text("Reduced by \(percentage)%")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(20)
                .scaleEffect(animateStressChange ? 1.0 : 0.8)
                .opacity(animateStressChange ? 1.0 : 0.0)
                .animation(.spring(response: 0.5, dampingFraction: 0.6).delay(0.8), value: animateStressChange)
            }
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
    
    // MARK: - Stats Cards View
    
    private func statsCardsView(session: MeditationSession) -> some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                statCard(
                    icon: "clock.fill",
                    title: "Duration",
                    value: formatDuration(session.durationSeconds),
                    color: .primary
                )
                
                statCard(
                    icon: "heart.fill",
                    title: "Exercise",
                    value: session.exercise?.name ?? "Unknown",
                    color: .secondary
                )
            }
            
            if let completedAt = session.completedAt {
                statCard(
                    icon: "calendar",
                    title: "Completed",
                    value: formatDate(completedAt),
                    color: .primary
                )
            }
        }
    }
    
    private func statCard(icon: String, title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .textCase(.uppercase)
            }
            
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.text)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Rating Views
    
    private var ratingPromptView: some View {
        VStack(spacing: 16) {
            Text("How was your session?")
                .font(.headline)
                .foregroundColor(.text)
            
            Button(action: { withAnimation { showRatingView = true } }) {
                HStack(spacing: 8) {
                    Image(systemName: "star")
                    Text("Rate Session")
                }
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.primary.opacity(0.1))
                .cornerRadius(24)
            }
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
    
    private var ratingInputView: some View {
        VStack(spacing: 20) {
            Text("Rate your session")
                .font(.headline)
                .foregroundColor(.text)
            
            HStack(spacing: 12) {
                ForEach(1...5, id: \.self) { rating in
                    Button(action: { selectedRating = rating }) {
                        Image(systemName: selectedRating ?? 0 >= rating ? "star.fill" : "star")
                            .font(.title2)
                            .foregroundColor(selectedRating ?? 0 >= rating ? .primary : .gray.opacity(0.3))
                    }
                }
            }
            
            if selectedRating != nil {
                Button(action: submitRating) {
                    Text("Submit")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.primary)
                        .cornerRadius(12)
                }
                .padding(.top, 8)
            }
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
    
    private func ratingDisplayView(rating: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.secondary)
            Text("Rated \(rating) star\(rating > 1 ? "s" : "")")
                .font(.subheadline)
                .foregroundColor(.text)
            Spacer()
            HStack(spacing: 4) {
                ForEach(1...5, id: \.self) { index in
                    Image(systemName: index <= rating ? "star.fill" : "star")
                        .font(.caption)
                        .foregroundColor(index <= rating ? .primary : .gray.opacity(0.3))
                }
            }
        }
        .padding(16)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
    
    // MARK: - Next Exercise Recommendation
    
    private func nextExerciseRecommendationView(recommendation: Exercise) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Recommended Next")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                        .textCase(.uppercase)
                    
                    Text(recommendation.name)
                        .font(.headline)
                        .foregroundColor(.text)
                }
                
                Spacer()
                
                Image(systemName: "sparkles")
                    .font(.title3)
                    .foregroundColor(.primary)
            }
            
            Text(recommendation.description)
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .lineLimit(2)
            
            HStack(spacing: 16) {
                Label(
                    formatDuration(recommendation.durationSeconds),
                    systemImage: "clock"
                )
                .font(.caption)
                .foregroundColor(.textSecondary)
                
                Label(
                    recommendation.type.displayName,
                    systemImage: "leaf.fill"
                )
                .font(.caption)
                .foregroundColor(.textSecondary)
            }
            
            Button(action: { showNextExerciseSheet = true }) {
                Text("View Exercise")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.primary.opacity(0.1))
                    .cornerRadius(10)
            }
        }
        .padding(20)
        .background(
            LinearGradient(
                colors: [Color.primary.opacity(0.05), Color.secondary.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.primary.opacity(0.2), lineWidth: 1)
        )
    }
    
    // MARK: - Action Buttons
    
    private var actionButtonsView: some View {
        VStack(spacing: 12) {
            Button(action: { dismiss() }) {
                Text("Back to Home")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical