import SwiftUI

/// Система отступов и размеров элементов приложения
enum Spacing {
    // MARK: - Base Spacing Units
    
    /// Минимальный отступ (2pt)
    static let xxxs: CGFloat = 2
    
    /// Очень маленький отступ (4pt)
    static let xxs: CGFloat = 4
    
    /// Маленький отступ (8pt)
    static let xs: CGFloat = 8
    
    /// Средне-маленький отступ (12pt)
    static let sm: CGFloat = 12
    
    /// Средний отступ (16pt)
    static let md: CGFloat = 16
    
    /// Средне-большой отступ (20pt)
    static let lg: CGFloat = 20
    
    /// Большой отступ (24pt)
    static let xl: CGFloat = 24
    
    /// Очень большой отступ (32pt)
    static let xxl: CGFloat = 32
    
    /// Максимальный отступ (40pt)
    static let xxxl: CGFloat = 40
    
    /// Огромный отступ (48pt)
    static let huge: CGFloat = 48
    
    /// Гигантский отступ (64pt)
    static let giant: CGFloat = 64
    
    // MARK: - Screen Margins
    
    /// Горизонтальные отступы экрана
    static let screenHorizontal: CGFloat = 20
    
    /// Вертикальные отступы экрана
    static let screenVertical: CGFloat = 24
    
    /// Верхний отступ экрана (с учетом safe area)
    static let screenTop: CGFloat = 16
    
    /// Нижний отступ экрана (с учетом safe area)
    static let screenBottom: CGFloat = 24
    
    // MARK: - Component Spacing
    
    /// Отступы внутри кнопок
    static let buttonPadding: EdgeInsets = .init(
        top: 16,
        leading: 24,
        bottom: 16,
        trailing: 24
    )
    
    /// Отступы внутри маленьких кнопок
    static let buttonPaddingSmall: EdgeInsets = .init(
        top: 12,
        leading: 16,
        bottom: 12,
        trailing: 16
    )
    
    /// Отступы внутри больших кнопок
    static let buttonPaddingLarge: EdgeInsets = .init(
        top: 20,
        leading: 32,
        bottom: 20,
        trailing: 32
    )
    
    /// Отступы внутри карточек
    static let cardPadding: EdgeInsets = .init(
        top: 16,
        leading: 16,
        bottom: 16,
        trailing: 16
    )
    
    /// Отступы внутри больших карточек
    static let cardPaddingLarge: EdgeInsets = .init(
        top: 24,
        leading: 20,
        bottom: 24,
        trailing: 20
    )
    
    /// Отступы внутри текстовых полей
    static let textFieldPadding: EdgeInsets = .init(
        top: 12,
        leading: 16,
        bottom: 12,
        trailing: 16
    )
    
    /// Отступы внутри секций списка
    static let listSectionPadding: EdgeInsets = .init(
        top: 12,
        leading: 20,
        bottom: 12,
        trailing: 20
    )
    
    /// Отступы внутри модальных окон
    static let modalPadding: EdgeInsets = .init(
        top: 24,
        leading: 20,
        bottom: 24,
        trailing: 20
    )
    
    // MARK: - Element Spacing
    
    /// Расстояние между элементами в вертикальном стеке (маленькое)
    static let stackVerticalSmall: CGFloat = 8
    
    /// Расстояние между элементами в вертикальном стеке (среднее)
    static let stackVerticalMedium: CGFloat = 16
    
    /// Расстояние между элементами в вертикальном стеке (большое)
    static let stackVerticalLarge: CGFloat = 24
    
    /// Расстояние между элементами в горизонтальном стеке (маленькое)
    static let stackHorizontalSmall: CGFloat = 8
    
    /// Расстояние между элементами в горизонтальном стеке (среднее)
    static let stackHorizontalMedium: CGFloat = 12
    
    /// Расстояние между элементами в горизонтальном стеке (большое)
    static let stackHorizontalLarge: CGFloat = 16
    
    /// Расстояние между секциями
    static let sectionSpacing: CGFloat = 32
    
    /// Расстояние между группами элементов
    static let groupSpacing: CGFloat = 24
    
    /// Расстояние между элементами списка
    static let listItemSpacing: CGFloat = 12
    
    // MARK: - Icon Sizes
    
    /// Размер иконки (маленькой)
    static let iconSmall: CGFloat = 16
    
    /// Размер иконки (средней)
    static let iconMedium: CGFloat = 24
    
    /// Размер иконки (большой)
    static let iconLarge: CGFloat = 32
    
    /// Размер иконки (очень большой)
    static let iconXLarge: CGFloat = 48
    
    /// Размер иконки достижения
    static let iconAchievement: CGFloat = 64
    
    // MARK: - Avatar Sizes
    
    /// Размер аватара (маленького)
    static let avatarSmall: CGFloat = 32
    
    /// Размер аватара (среднего)
    static let avatarMedium: CGFloat = 48
    
    /// Размер аватара (большого)
    static let avatarLarge: CGFloat = 64
    
    /// Размер аватара (очень большого)
    static let avatarXLarge: CGFloat = 96
    
    // MARK: - Border Radius
    
    /// Радиус скругления (маленький)
    static let radiusSmall: CGFloat = 8
    
    /// Радиус скругления (средний)
    static let radiusMedium: CGFloat = 12
    
    /// Радиус скругления (большой)
    static let radiusLarge: CGFloat = 16
    
    /// Радиус скругления (очень большой)
    static let radiusXLarge: CGFloat = 24
    
    /// Радиус скругления (круглый)
    static let radiusCircle: CGFloat = 9999
    
    /// Радиус скругления кнопок
    static let radiusButton: CGFloat = 12
    
    /// Радиус скругления карточек
    static let radiusCard: CGFloat = 16
    
    /// Радиус скругления модальных окон
    static let radiusModal: CGFloat = 20
    
    // MARK: - Border Width
    
    /// Толщина границы (тонкая)
    static let borderThin: CGFloat = 1
    
    /// Толщина границы (средняя)
    static let borderMedium: CGFloat = 2
    
    /// Толщина границы (толстая)
    static let borderThick: CGFloat = 3
    
    // MARK: - Divider Height
    
    /// Высота разделителя (тонкого)
    static let dividerThin: CGFloat = 0.5
    
    /// Высота разделителя (среднего)
    static let dividerMedium: CGFloat = 1
    
    /// Высота разделителя (толстого)
    static let dividerThick: CGFloat = 2
    
    // MARK: - Component Heights
    
    /// Высота кнопки (маленькой)
    static let buttonHeightSmall: CGFloat = 40
    
    /// Высота кнопки (средней)
    static let buttonHeightMedium: CGFloat = 48
    
    /// Высота кнопки (большой)
    static let buttonHeightLarge: CGFloat = 56
    
    /// Высота текстового поля
    static let textFieldHeight: CGFloat = 48
    
    /// Высота элемента списка
    static let listItemHeight: CGFloat = 56
    
    /// Высота таббара
    static let tabBarHeight: CGFloat = 56
    
    /// Высота навигационного бара
    static let navigationBarHeight: CGFloat = 44
    
    // MARK: - Special Sizes
    
    /// Размер индикатора стресса
    static let stressIndicatorSize: CGFloat = 120
    
    /// Размер дыхательной анимации
    static let breathingAnimationSize: CGFloat = 200
    
    /// Размер таймера сессии
    static let sessionTimerSize: CGFloat = 240
    
    /// Размер карточки прогресса
    static let progressCardHeight: CGFloat = 100
    
    /// Размер карточки достижения
    static let achievementCardSize: CGFloat = 80
    
    /// Размер карточки голоса
    static let voiceCardHeight: CGFloat = 120
    
    /// Размер карточки упражнения
    static let exerciseCardHeight: CGFloat = 140
    
    // MARK: - Grid Spacing
    
    /// Расстояние между колонками в сетке
    static let gridColumnSpacing: CGFloat = 12
    
    /// Расстояние между рядами в сетке
    static let gridRowSpacing: CGFloat = 12
    
    // MARK: - Safe Area Insets
    
    /// Минимальный отступ от safe area (сверху)
    static let safeAreaTop: CGFloat = 8
    
    /// Минимальный отступ от safe area (снизу)
    static let safeAreaBottom: CGFloat = 8
    
    /// Минимальный отступ от safe area (слева/справа)
    static let safeAreaHorizontal: CGFloat = 0
    
    // MARK: - Animation Distances
    
    /// Расстояние для slide-in анимации
    static let slideInDistance: CGFloat = 20
    
    /// Расстояние для bounce анимации
    static let bounceDistance: CGFloat = 10
    
    // MARK: - Helper Methods
    
    /// Возвращает отступы для экрана с учетом safe area
    /// - Parameter includeSafeArea: Включать ли safe area в расчет
    /// - Returns: EdgeInsets с отступами
    static func screenPadding(includeSafeArea: Bool = true) -> EdgeInsets {
        if includeSafeArea {
            return .init(
                top: screenTop,
                leading: screenHorizontal,
                bottom: screenBottom,
                trailing: screenHorizontal
            )
        } else {
            return .init(
                top: screenVertical,
                leading: screenHorizontal,
                bottom: screenVertical,
                trailing: screenHorizontal
            )
        }
    }
    
    /// Возвращает отступы для секции
    /// - Parameter size: Размер отступов (small, medium, large)
    /// - Returns: EdgeInsets с отступами
    static func sectionPadding(size: PaddingSize = .medium) -> EdgeInsets {
        switch size {
        case .small:
            return .init(top: xs, leading: md, bottom: xs, trailing: md)
        case .medium:
            return .init(top: md, leading: md, bottom: md, trailing: md)
        case .large:
            return .init(top: lg, leading: lg, bottom: lg, trailing: lg)
        }
    }
    
    /// Возвращает расстояние между элементами стека
    /// - Parameters:
    ///   - axis: Ось стека (horizontal/vertical)
    ///   - size: Размер расстояния (small, medium, large)
    /// - Returns: CGFloat с расстоянием
    static func stackSpacing(axis: Axis, size: SpacingSize = .medium) -> CGFloat {
        switch (axis, size) {
        case (.horizontal, .small):
            return stackHorizontalSmall
        case (.horizontal, .medium):
            return stackHorizontalMedium
        case (.horizontal, .large):
            return stackHorizontalLarge
        case (.vertical, .small):
            return stackVerticalSmall
        case (.vertical, .medium):
            return stackVerticalMedium
        case (.vertical, .large):
            return stackVerticalLarge
        }
    }
}

// MARK: - Supporting Types

extension Spacing {
    enum PaddingSize {
        case small
        case medium
        case large
    }
    
    enum SpacingSize {
        case small
        case medium
        case large
    }
}

// MARK: - View Extensions

extension View {
    /// Применяет стандартные отступы экрана
    func screenPadding(includeSafeArea: Bool = true) -> some View {
        self.padding(Spacing.screenPadding(includeSafeArea: includeSafeArea))
    }
    
    /// Применяет горизонтальные отступы экрана
    func screenHorizontalPadding() -> some View {
        self.padding(.horizontal, Spacing.screenHorizontal)
    }
    
    /// Применяет вертикальные отступы экрана
    func screenVerticalPadding() -> some View {
        self.padding(.vertical, Spacing.screenVertical)
    }
    
    /// Применяет отступы карточки
    func cardPadding(size: Spacing.PaddingSize = .medium) -> some View {
        switch size {
        case .small:
            return self.padding(Spacing.cardPadding)
        case .medium:
            return self.padding(Spacing.cardPadding)
        case .large:
            return self.padding(Spacing.cardPaddingLarge)
        }
    }
    
    /// Применяет отступы кнопки
    func buttonPadding(size: Spacing.PaddingSize = .medium) -> some View {
        switch size {
        case .small:
            return self.padding(Spacing.buttonPaddingSmall)
        case .medium:
            return self.padding(Spacing.buttonPadding)
        case .large:
            return self.padding(Spacing.buttonPaddingLarge)
        }
    }
}

// MARK: - EdgeInsets Extension

extension EdgeInsets {
    /// Создает EdgeInsets с одинаковыми отступами со всех сторон
    static func all(_ value: CGFloat) -> EdgeInsets {
        EdgeInsets(top: value, leading: value, bottom: value, trailing: value)
    }
    
    /// Создает EdgeInsets с горизонтальными и вертикальными отступами
    static func symmetric(horizontal: CGFloat = 0, vertical: CGFloat = 0) -> EdgeInsets {
        EdgeInsets(top: vertical, leading: horizontal, bottom: vertical, trailing: horizontal)
    }
    
    /// Создает EdgeInsets только с верхним