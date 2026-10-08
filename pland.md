Yang OVER (berlebihan)
1. ~16 dependency tidak dipakai sama sekali (terverifikasi: nol referensi di src/): axios, @expo/ui, expo-glass-effect, expo-symbols, expo-web-browser, expo-image, expo-device, expo-linking, expo-sensors, expo-image-picker, expo-image-manipulator, expo-font, expo-system-ui, @react-native-community/datetimepicker, react-native-worklets, @react-native-ml-kit/text-recognition. Ini bundle size + biaya upgrade SDK yang tidak perlu.

2. Kalender diduplikasi 5 kali. Empat CalendarModal yang nyaris identik (Habits, Fitness, Nutrition, Finance) + DatePickerModal. Array MONTHS didefinisikan ulang 6 kali (constants/fitness.ts:35, types/finance.ts:87, 3 modal, DatePickerModal). CategoryFilter juga dobel (Fitness & Habits), dan formatDateKey ada di 3 tempat.

3. File monolitik. finance.tsx 1.143 baris · TransactionModal.tsx 1.241 · HabitCard.tsx 1.229 · fitnessStyles.ts 1.001 · financeStyles.ts 863. Satu TransactionModal menangani income + expense + transfer + kalkulator + saran deskripsi sekaligus.

4. Ledakan modal. Fitur Finance sendiri punya 11 modal (Transaction, AccountDetail, History, AddAccount, Calendar, DatePicker, DialogModals ×3, CategoryBreakdown, CategoryBudget, ManageAccounts, Calculator). Banyak yang lebih tepat jadi bottom sheet atau route.

5. Sistem alarm habit over-built. habitNotificationService.ts 515 baris + full-screen alarm modal + 4 file suara + channel Android + snooze + agenda mingguan — untuk habit tracker personal. Ini area paling rawan bug (permission Android 13+, exact alarm, fallback require() untuk Expo Go).

6. Database makanan hardcoded 4.059 baris. nutritionDatabase.ts 2.828 + brandFoodDatabase.ts 1.231 baris (~221 item di file pertama, mayoritas makanan Indonesia). Berat untuk data yang idealnya di-seed/di-generate — dan tetap tidak menutup kebutuhan (user masih harus bikin custom food).

7. Bleeding-edge stack untuk app yang sudah dipakai. SDK 57 + React 19.2 + RN 0.86 + typedRoutes + reactCompiler + Reanimated 4/worklets. Sinyal friksi peer-dependency bahkan sudah masuk eas.json (NPM_CONFIG_LEGACY_PEER_DEPS). Tiap rilis SDK akan memecahkan sesuatu.

8. Sisa template: global.css tidak direferensikan siapa pun, dan package.json masih "name": "testdev