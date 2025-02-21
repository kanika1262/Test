const express = require("express");
const webpush = require("web-push");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const port = 3000;

const apiKeys = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY
};

webpush.setVapidDetails(
    "mailto:YOUR_EMAIL@example.com",
    apiKeys.publicKey,
    apiKeys.privateKey
);

app.use(cors());
app.use(express.json());

const subDatabase = [];

app.post("/save-subscription", (req, res) => {
    const subscription = req.body;

    if (!subDatabase.some(sub => JSON.stringify(sub) === JSON.stringify(subscription))) {
        subDatabase.push(subscription);
    }

    res.json({ status: "Success", message: "Subscription saved!" });
});

const sendPushNotification = async (message) => {
    for (let i = subDatabase.length - 1; i >= 0; i--) {
        const subscription = subDatabase[i];
        
        try {
            await webpush.sendNotification(subscription, JSON.stringify({
                title: "New Notification!",
                body: message,
                icon: "icon.png",
                badge: "badge.png",
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


app.get("/send-notification", async (req, res) => {
    await sendPushNotification("Hello!");
    res.json({ status: "Success", message: "Notification sent!" });
});

const scheduleNotification = (cronTime, message) => {
    cron.schedule(cronTime, () => {
        console.log(`Sending notification: ${message}`);
        sendPushNotification(message);
    });
};

scheduleNotification("30 11 * * *", "It's 11:30 AM!");
scheduleNotification("30 16 * * *", "It's 4:30 PM!");
scheduleNotification("09 18 * * *", "It's 6:09 PM!");

app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
});
