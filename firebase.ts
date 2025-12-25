
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "familylink-app.firebaseapp.com",
  projectId: "familylink-app",
  storageBucket: "familylink-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const messaging = app ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: 'YOUR_PUBLIC_VAPID_KEY' 
      });
      return token;
    }
  } catch (error) {
    console.error('Notification permission failed', error);
  }
  return null;
};

export const syncToCloud = async (collectionName: string, item: any, familyId: string) => {
  if (!db || !familyId || !item.isShared) return;
  await setDoc(doc(db, collectionName, item.id), {
    ...item,
    familyId
  });
};

export const removeFromCloud = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error("Cloud delete failed", e);
  }
};
