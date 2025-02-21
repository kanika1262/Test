const checkPermission = () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
        throw new Error("Push notifications are not supported by your browser.");
    }
};

const registerSW = async () => {
    return await navigator.serviceWorker.register("sw.js");
};

const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notification permission not granted!");
    }
};

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
};

const unsubscribePush = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        await subscription.unsubscribe();
        console.log("Unsubscribed successfully!");
    } else {
        console.log("No active subscription found.");
    }
};

const saveSubscription = async (subscription) => {
    await fetch("http://localhost:3000/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
    });
};

const main = async () => {
    try {
        checkPermission();
        await requestNotificationPermission();

        await unsubscribePush();

        const registration = await registerSW();
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array("BI-cuxz1-6lW-P_iIRBSfYQ1DUwCvIxq2FBmwGJ02NQFL_olo8DO-OfhUgHBAf2VVuxqdp1EFBhFbT2ke132x3E"),
        });

        await saveSubscription(subscription);
        console.log("Push subscription saved!");

    } catch (error) {
        console.error("Error:", error);
    }
};

main();
