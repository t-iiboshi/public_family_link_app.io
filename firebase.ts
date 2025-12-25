
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

/**
 * 【Firebase 設定】
 * コンソール > プロジェクトの設定 > 全般 > マイアプリ で取得した内容
 */
const firebaseConfig = {
  apiKey: "AIzaSyA3z_eixyjOZwa080WV7owvCYztaYe864E", 
  authDomain: "familylinkapp-31dbf.firebaseapp.com",
  projectId: "familylinkapp-31dbf",
  storageBucket: "familylinkapp-31dbf.firebasestorage.app",
  messagingSenderId: "106052821526",
  appId: "1:106052821526:web:c0ef46758c5f9f9bc7cb37"
};

// 設定がデフォルトのプレースホルダ（YOUR_...）でないか、または空でないかを確認
const isConfigured = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.startsWith("YOUR_") && 
  firebaseConfig.apiKey !== "";

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const messaging = app ? getMessaging(app) : null;

/**
 * 【VAPID キー】
 * プロジェクトの設定 > Cloud Messaging > ウェブプッシュ証明書 で生成した鍵ペアをここに貼り付けます。
 * これを設定すると、スマホへのプッシュ通知が有効になります。
 */
const VAPID_KEY = 'BKGdLhkOxdhOXagt42oNUiH_UPhtjD-2y_MrdAxDC_9YMHI_8J5GpTnafPwnP2RTr_br-ep0p0BtvyFYW889xm4'; 

export const requestNotificationPermission = async () => {
  if (!messaging || !VAPID_KEY || VAPID_KEY === 'BKGdLhkOxdhOXagt42oNUiH_UPhtjD-2y_MrdAxDC_9YMHI_8J5GpTnafPwnP2RTr_br-ep0p0BtvyFYW889xm4') {
    console.log('Push notification not configured (VAPID Key missing)');
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY 
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
  try {
    await setDoc(doc(db, collectionName, item.id), {
      ...item,
      familyId
    });
  } catch (e) {
    console.error("Cloud sync failed. Make sure Firestore Rules are set to allow access.", e);
  }
};

export const removeFromCloud = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error("Cloud delete failed", e);
  }
};
