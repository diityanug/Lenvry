# 1. Install semua dependencies bawaan dari package.json
npm install

# 2. Install penyimpanan lokal (Wajib supaya data riwayat makan nggak ilang pas ditutup)
npx expo install @react-native-async-storage/async-storage

# 3. Install pemilih gambar (Wajib untuk fitur Scan Foto Piring)
npx expo install expo-image-picker

# 4. Jalankan aplikasi
npx expo start