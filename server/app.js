const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const cron = require("node-cron");
const admin = require("firebase-admin");
require("dotenv").config();
const app = express();
const port = 3000;

const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
if (!serviceAccountPath) {
    throw new Error("Missing FIREBASE_ADMIN_SDK_PATH in .env");
}

const serviceAccount = require(path.resolve(serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const apiKeys = {
    publicKey: "BI-cuxz1-6lW-P_iIRBSfYQ1DUwCvIxq2FBmwGJ02NQFL_olo8DO-OfhUgHBAf2VVuxqdp1EFBhFbT2ke132x3E",
    privateKey: "Qhcu-Lkgpu8wonuSpw3rlpCFvx3F3JiR-9Iygx9pcV0",
};

webpush.setVapidDetails(
    "mailto:YOUR_EMAIL@example.com",
    apiKeys.publicKey,
    apiKeys.privateKey
);

app.use(cors());
app.use(express.json());

const subDatabase = [];
const fcmTokens = new Set();

app.post("/save-subscription", (req, res) => {
    const subscription = req.body;
    if (!subDatabase.some(sub => JSON.stringify(sub) === JSON.stringify(subscription))) {
        subDatabase.push(subscription);
    }
    res.json({ status: "Success", message: "Subscription saved!" });
});

app.post("/save-fcm-token", (req, res) => {
    const { token } = req.body;
    if (token) {
        fcmTokens.add(token);
    }
    res.json({ status: "Success", message: "FCM Token saved!" });
});

const sendPushNotification = async (message) => {
    for (let i = subDatabase.length - 1; i >= 0; i--) {
        const subscription = subDatabase[i];
        try {
            console.log("Sending Web Push to:", subscription.endpoint);
            await webpush.sendNotification(subscription, JSON.stringify({
                title: "New Notification!",
                body: message,
                icon: "/icon.png",
                badge: "/badge.png",
            }));
        } catch (error) {
            if (error.statusCode === 410) {
                console.warn("Removing expired subscription:", subscription.endpoint);
                subDatabase.splice(i, 1);
            } else {
                console.error("Push Error:", error);
            }
        }
    }
};

const sendFirebaseNotification = async (message) => {
    const tokensArray = Array.from(fcmTokens);
    if (tokensArray.length === 0) return;
    
    const payload = {
        notification: {
            title: "New Notification!",
            body: message,
        },
    };

    try {
        console.log("Sending Firebase Notification to:", tokensArray);
        const response = await admin.messaging().sendToDevice(tokensArray, payload);
        response.results.forEach((result, index) => {
            if (result.error) {
                console.error("FCM Error:", result.error);
                fcmTokens.delete(tokensArray[index]);
            }
        });
    } catch (error) {
        console.error("Firebase Notification Error:", error);
    }
};

app.get("/send-notification", async (req, res) => {
    const message = "Hello!";
    await sendPushNotification(message);
    await sendFirebaseNotification(message);
    res.json({ status: "Success", message: "Notification sent!" });
});

const scheduleNotification = (cronTime, message) => {
    cron.schedule(cronTime, () => {
        console.log(`Sending notification: ${message}`);
        sendPushNotification(message);
        sendFirebaseNotification(message);
    });
};

scheduleNotification("30 11 * * *", "It's 11:30 AM!");
scheduleNotification("30 16 * * *", "It's 4:30 PM!");

app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
});
