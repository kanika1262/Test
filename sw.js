self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();  
        console.log("Received Push Notification:", data);

        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icon.png",
            badge: "/badge.png",
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [{ action: "open_url", title: "Open App" }],
        });
    } catch (error) {
        console.error("Push Notification Error:", error);
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow("https://drapcode.com"));
});

