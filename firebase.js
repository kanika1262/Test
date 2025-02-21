import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("Notification permission denied.");
            return;
        }

        const token = await getToken(messaging, {
            vapidKey: process.env.PUBLIC_KEY,
        });

        if (token) {
            console.log("FCM Token:", token);
            await fetch("http://localhost:3000/save-fcm-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
        }
    } catch (error) {
        console.error("Error requesting permission:", error);
    }
};

export const onForegroundNotification = () => {
    onMessage(messaging, (payload) => {
        console.log("Foreground Notification:", payload);
        new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.image,
        });
    });
};