/**
 * Firebase yapılandırması – şablon
 *
 * 1. Bu dosyayı firebase-config.js olarak kopyalayın:
 *    cp firebase-config.example.js firebase-config.js
 *
 * 2. Firebase Console'dan kendi projenizin config değerlerini alın
 *    (Project Settings > Your apps > Add app > Web)
 *
 * 3. Aşağıdaki değerleri kendi bilgilerinizle değiştirin.
 *
 * ÖNEMLİ: firebase-config.js .gitignore'da – gerçek değerlerinizi asla commit etmeyin.
 */
window.EITHERIST_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
