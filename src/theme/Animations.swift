//
//  Animations.swift
//  MindFlow
//
//  Created by MindFlow Team
//  Copyright © 2024 MindFlow. All rights reserved.
//

import SwiftUI

// MARK: - Animation Configurations

struct Animations {
    
    // MARK: - Breathing Animations
    
    struct Breathing {
        /// Медленная дыхательная анимация (низкий стресс)
        static let slow = Animation
            .easeInOut(duration: 6.0)
            .repeatForever(autoreverses: true)
        
        /// Средняя дыхательная анимация (средний стресс)
        static let medium = Animation
            .easeInOut(duration: 4.5)
            .repeatForever(autoreverses: true)
        
        /// Быстрая дыхательная анимация (высокий стресс)
        static let fast = Animation
            .easeInOut(duration: 3.0)
            .repeatForever(autoreverses: true)
        
        /// Адаптивная дыхательная анимация на основе уровня стресса
        static func adaptive(stressLevel: Int) -> Animation {
            let duration: Double
            
            switch stressLevel {
            case 0...3:
                duration = 6.0
            case 4...6:
                duration = 4.5
            case 7...10:
                duration = 3.0
            default:
                duration = 4.5
            }
            
            return Animation
                .easeInOut(duration: duration)
                .repeatForever(autoreverses: true)
        }
        
        /// Пульсация для индикатора стресса
        static let pulse = Animation
            .easeInOut(duration: 2.0)
            .repeatForever(autoreverses: true)
    }
    
    // MARK: - Transition Animations
    
    struct Transitions {
        /// Быстрый переход между экранами
        static let quick = Animation.easeInOut(duration: 0.2)
        
        /// Стандартный переход между экранами
        static let standard = Animation.easeInOut(duration: 0.3)
        
        /// Плавный переход между экранами
        static let smooth = Animation.easeInOut(duration: 0.4)
        
        /// Медленный переход для важных изменений
        static let slow = Animation.easeInOut(duration: 0.6)
        
        /// Пружинный переход
        static let spring = Animation.spring(
            response: 0.5,
            dampingFraction: 0.7,
            blendDuration: 0.3
        )
        
        /// Мягкий пружинный переход
        static let softSpring = Animation.spring(
            response: 0.6,
            dampingFraction: 0.8,
            blendDuration: 0.4
        )
    }
    
    // MARK: - Fade Animations
    
    struct Fade {
        /// Быстрое появление/исчезновение
        static let quick = Animation.easeInOut(duration: 0.15)
        
        /// Стандартное появление/исчезновение
        static let standard = Animation.easeInOut(duration: 0.25)
        
        /// Плавное появление/исчезновение
        static let smooth = Animation.easeInOut(duration: 0.35)
        
        /// Медленное появление/исчезновение
        static let slow = Animation.easeInOut(duration: 0.5)
        
        /// Fade in с задержкой
        static func fadeInDelayed(_ delay: Double) -> Animation {
            Animation.easeInOut(duration: 0.25).delay(delay)
        }
        
        /// Fade out с задержкой
        static func fadeOutDelayed(_ delay: Double) -> Animation {
            Animation.easeInOut(duration: 0.25).delay(delay)
        }
    }
    
    // MARK: - Scale Animations
    
    struct Scale {
        /// Быстрое масштабирование
        static let quick = Animation.easeInOut(duration: 0.2)
        
        /// Стандартное масштабирование
        static let standard = Animation.easeInOut(duration: 0.3)
        
        /// Пружинное масштабирование
        static let spring = Animation.spring(
            response: 0.4,
            dampingFraction: 0.6,
            blendDuration: 0.2
        )
        
        /// Масштабирование при нажатии
        static let press = Animation.easeInOut(duration: 0.1)
        
        /// Масштабирование при отпускании
        static let release = Animation.spring(
            response: 0.3,
            dampingFraction: 0.5,
            blendDuration: 0.2
        )
    }
    
    // MARK: - Progress Animations
    
    struct Progress {
        /// Заполнение прогресс-бара
        static let fill = Animation.easeInOut(duration: 0.8)
        
        /// Быстрое обновление прогресса
        static let update = Animation.easeInOut(duration: 0.4)
        
        /// Плавное изменение прогресса
        static let smooth = Animation.easeInOut(duration: 1.0)
        
        /// Круговой прогресс (таймер сессии)
        static let circular = Animation.linear(duration: 1.0)
    }
    
    // MARK: - Card Animations
    
    struct Card {
        /// Появление карточки
        static let appear = Animation.spring(
            response: 0.5,
            dampingFraction: 0.7,
            blendDuration: 0.3
        )
        
        /// Исчезновение карточки
        static let disappear = Animation.easeInOut(duration: 0.3)
        
        /// Переворот карточки
        static let flip = Animation.easeInOut(duration: 0.6)
        
        /// Встряска карточки (для ошибок)
        static let shake = Animation.default
    }
    
    // MARK: - Achievement Animations
    
    struct Achievement {
        /// Разблокировка достижения
        static let unlock = Animation.spring(
            response: 0.6,
            dampingFraction: 0.5,
            blendDuration: 0.4
        )
        
        /// Появление бейджа
        static let badgeAppear = Animation.spring(
            response: 0.5,
            dampingFraction: 0.6,
            blendDuration: 0.3
        )
        
        /// Блеск достижения
        static let shine = Animation
            .linear(duration: 1.5)
            .repeatForever(autoreverses: false)
        
        /// Пульсация нового достижения
        static let newBadgePulse = Animation
            .easeInOut(duration: 1.0)
            .repeatForever(autoreverses: true)
    }
    
    // MARK: - Notification Animations
    
    struct Notification {
        /// Появление уведомления
        static let slideIn = Animation.spring(
            response: 0.4,
            dampingFraction: 0.7,
            blendDuration: 0.2
        )
        
        /// Исчезновение уведомления
        static let slideOut = Animation.easeInOut(duration: 0.3)
        
        /// Встряска для важных уведомлений
        static let attention = Animation.default
    }
    
    // MARK: - Loading Animations
    
    struct Loading {
        /// Вращение индикатора загрузки
        static let spinner = Animation
            .linear(duration: 1.0)
            .repeatForever(autoreverses: false)
        
        /// Пульсация индикатора загрузки
        static let pulse = Animation
            .easeInOut(duration: 1.5)
            .repeatForever(autoreverses: true)
        
        /// Точки загрузки
        static let dots = Animation
            .easeInOut(duration: 0.6)
            .repeatForever(autoreverses: true)
    }
    
    // MARK: - Gesture Animations
    
    struct Gesture {
        /// Анимация свайпа
        static let swipe = Animation.easeOut(duration: 0.3)
        
        /// Анимация перетаскивания
        static let drag = Animation.interactiveSpring(
            response: 0.3,
            dampingFraction: 0.8,
            blendDuration: 0.2
        )
        
        /// Возврат после свайпа
        static let snapBack = Animation.spring(
            response: 0.4,
            dampingFraction: 0.7,
            blendDuration: 0.2
        )
    }
}

// MARK: - Animation Modifiers

extension View {
    
    /// Применить дыхательную анимацию
    func breathingAnimation(stressLevel: Int, isAnimating: Bool = true) -> some View {
        self.animation(
            isAnimating ? Animations.Breathing.adaptive(stressLevel: stressLevel) : nil,
            value: isAnimating
        )
    }
    
    /// Применить fade-in анимацию
    func fadeIn(duration: Double = 0.25, delay: Double = 0) -> some View {
        self
            .opacity(0)
            .animation(
                Animation.easeInOut(duration: duration).delay(delay),
                value: true
            )
    }
    
    /// Применить fade-out анимацию
    func fadeOut(duration: Double = 0.25, delay: Double = 0) -> some View {
        self
            .opacity(1)
            .animation(
                Animation.easeInOut(duration: duration).delay(delay),
                value: false
            )
    }
    
    /// Применить масштабирование при нажатии
    func pressScale() -> some View {
        self.scaleEffect(1.0)
            .animation(Animations.Scale.press, value: false)
    }
    
    /// Применить встряску (для ошибок)
    func shake(trigger: Int) -> some View {
        self.modifier(ShakeEffect(shakes: trigger))
    }
    
    /// Применить пульсацию
    func pulse(isActive: Bool = true) -> some View {
        self.scaleEffect(isActive ? 1.05 : 1.0)
            .animation(
                isActive ? Animations.Breathing.pulse : nil,
                value: isActive
            )
    }
    
    /// Применить появление карточки
    func cardAppear(delay: Double = 0) -> some View {
        self
            .opacity(0)
            .scaleEffect(0.9)
            .animation(
                Animations.Card.appear.delay(delay),
                value: true
            )
    }
}

// MARK: - Shake Effect

struct ShakeEffect: GeometryEffect {
    var shakes: Int
    var animatableData: Int {
        get { shakes }
        set { shakes = newValue }
    }
    
    func effectValue(size: CGSize) -> ProjectionTransform {
        let translation = sin(CGFloat(shakes) * .pi * 2) * 10
        return ProjectionTransform(CGAffineTransform(translationX: translation, y: 0))
    }
}

// MARK: - Custom Transition Extensions

extension AnyTransition {
    
    /// Переход с масштабированием и fade
    static var scaleAndFade: AnyTransition {
        .asymmetric(
            insertion: .scale(scale: 0.8).combined(with: .opacity),
            removal: .scale(scale: 1.2).combined(with: .opacity)
        )
    }
    
    /// Переход со слайдом и fade
    static var slideAndFade: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }
    
    /// Переход с вращением
    static var rotate: AnyTransition {
        .modifier(
            active: RotateModifier(angle: .degrees(90), opacity: 0),
            identity: RotateModifier(angle: .zero, opacity: 1)
        )
    }
    
    /// Переход с появлением снизу
    static var slideUp: AnyTransition {
        .move(edge: .bottom).combined(with: .opacity)
    }
    
    /// Переход с появлением сверху
    static var slideDown: AnyTransition {
        .move(edge: .top).combined(with: .opacity)
    }
}

// MARK: - Rotate Modifier

struct RotateModifier: ViewModifier {
    let angle: Angle
    let opacity: Double
    
    func body(content: Content) -> some View {
        content
            .rotationEffect(angle)
            .opacity(opacity)
    }
}

// MARK: - Animation Timing Curves

extension Animation {
    
    /// Кастомная кривая для дыхательной анимации
    static var breathingCurve: Animation {
        .timingCurve(0.42, 0, 0.58, 1, duration: 4.5)
    }
    
    /// Кастомная кривая для плавного появления
    static var smoothAppear: Animation {
        .timingCurve(0.25, 0.1, 0.25, 1, duration: 0.4)
    }
    
    /// Кастомная кривая для быстрого исчезновения
    static var quickDisappear: Animation {
        .timingCurve(0.4, 0, 1, 1, duration: 0.2)
    }
}

// MARK: - Animation Constants

extension Animations {
    
    /// Длительности анимаций
    struct Duration {
        static let instant: Double = 0.1
        static let quick: Double = 0.2
        static let standard: Double = 0.3
        static let smooth: Double = 0.4
        static let slow: Double = 0.6
        static let breathingSlow: Double = 6.0
        static let breathingMedium: Double = 4.5
        static let breathingFast: Double = 3.0
    }
    
    /// Задержки анимаций
    struct Delay {
        static let none: Double = 0.0
        static let short: Double = 0.1
        static let medium: Double = 0.2
        static let long: Double = 0.4
    }
    
    /// Параметры пружины
    struct Spring {
        static let response: Double = 0.5
        static let dampingFraction: Double = 0.7
        static let blendDuration: Double = 0.3
    }
}