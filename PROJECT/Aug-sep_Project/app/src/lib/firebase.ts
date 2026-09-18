import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
// @firebase/auth의 타입 선언이 react-native 조건별로 분리되어 있지 않아
// getReactNativePersistence에 대한 타입 오류가 나지만, 런타임 코드는 정상 동작한다.
// @ts-expect-error - upstream typing gap, see: https://github.com/firebase/firebase-js-sdk/issues
import { initializeAuth, getReactNativePersistence } from "@firebase/auth";
import type { Auth } from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "southsidefreestyle-a7ed6.firebaseapp.com",
  projectId: "southsidefreestyle-a7ed6",
  storageBucket: "southsidefreestyle-a7ed6.firebasestorage.app",
  messagingSenderId: "20378666093",
  appId: "1:20378666093:web:fc2722700f3e02825a2b64",
};

const app = initializeApp(firebaseConfig);

// React Native에서는 AsyncStorage를 통해 로그인 상태를 저장해야
// 앱을 껐다 켜도 로그인이 유지된다.
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// React Native의 네트워크 계층은 Firestore가 기본으로 쓰는 WebChannel
// 스트리밍과 궁합이 안 좋아 "transport errored" 경고가 반복된다.
// long-polling을 강제해서 이 문제를 피한다.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
