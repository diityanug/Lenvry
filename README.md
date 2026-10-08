# ⚡ Lenvry — All-in-One Personal Life & Finance Companion

**Lenvry** is a modern, mobile-first personal productivity and financial management application built with **React Native**, **Expo SDK 57**, and **Expo Router**. It combines personal financial management, habit tracking, workout logging, and nutrition tracking into a single dark-mode interface designed for speed and clarity.

---

## 🌟 Key Features

### 💰 1. Finance & Wealth Manager
- **Master Accounts & Sub-Pockets**: Organize main bank accounts, e-wallets, or cash along with nested sub-pockets (e.g. Emergency Fund, Travel Savings).
- **Executive Net Worth**: Real-time calculation of total balance and monthly cash flow (Income vs. Expense).
- **Custom Categories & Icons**: Rich category picker with custom icon selections and color palettes.
- **Category Budgets & Analytics**: Set spending limits per category with visual health bars and top-spending breakdowns.
- **Interactive Calculator Keypad**: Built-in numeric keypad modal for easy entry of transaction amounts.
- **Reorderable Accounts**: Drag-and-drop account order customization.

### ⚡ 2. Habit Tracker & Alarms
- **Daily & Custom Schedules**: Support for daily habits, specific weekdays, or custom repeat frequencies.
- **Alarm & Notification Audio**: Integrated audio notifications with custom sound choices (`chime`, `digital`, `marimba`, `zen`).
- **Sub-tasks & Checklist**: Break down complex habits into manageable sub-steps.
- **Streaks & Progress**: Track daily completion rates and historical performance calendar.

### 🏃 3. Workout & Exercise Logger
- **Strength & Cardio Logs**: Track sets, reps, weight, distance, and duration.
- **Exercise Database & Presets**: Built-in exercise suggestions and custom workout routines.
- **Workout History**: Detailed history logs to monitor progressive overload and training volume.

### 🥗 4. Nutrition & Calorie Counter
- **Macro Summary**: Real-time breakdown of daily Calories, Protein, Carbs, and Fats against personalized targets.
- **Comprehensive Food Database**: Over 1,000+ pre-configured items including Indonesian local staples, popular brand foods (KFC, McD, Solaria, Starbucks, Chatime, etc.), snacks, and drinks.
- **Water Intake Tracker**: Visual glass-segmented water logging to maintain daily hydration goals.
- **Meal Logs**: Organize nutrition by Breakfast, Lunch, Dinner, and Snacks.

### 📌 5. Home Dashboard & Sticky Notes
- **Dynamic Header & Greeting**: Time-aware greeting displaying current date and profile name without truncation.
- **Daily Overview**: Snapshot of daily habits, workouts, nutrition progress, and total financial balance.
- **Pinned Sticky Notes**: Quick color-coded notes and checklist widgets directly on the home screen.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://docs.expo.dev/) (React Native `0.86.3` with React `19.2.3`)
- **Navigation & Routing**: [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based routing under `src/app/`)
- **State & Storage**: Custom serialized per-key Async Storage engine with atomic read-modify-write locks
- **Animations & UI**: React Native Reanimated v4, Gesture Handler, Vector Icons, SVG
- **Build & CI/CD**: Expo Application Services (EAS) CLI

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Bun (`bun`) package manager
- Expo Go app or Android Emulator / Physical Device

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lenvfry/lenvry.git
   cd lenvry
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Start the development server:**
   ```bash
   bunx expo start
   ```

4. **Run on Android:**
   - Scan the QR code using **Expo Go** or run:
   ```bash
   bunx expo start --android
   ```

---

## 📦 Building with EAS

Lenvry uses **EAS Build** to generate standalone APKs in the cloud.

### Preview APK Build (Android)
To build a standalone APK for testing:
```bash
bunx eas-cli build --platform android --profile preview
```

---

## 🧪 Quality & Verification

Run type-checking and linting before submitting pull requests:

```bash
# Run TypeScript type check
bunx tsc --noEmit

# Run Expo Linter
bunx expo lint
```

---

## 📄 License

This project is proprietary and intended for personal/private use.
