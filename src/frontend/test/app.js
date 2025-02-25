document.addEventListener("DOMContentLoaded", function () {
  const subscribeBtn = document.getElementById("subscribeBtn");
  const statusMessage = document.getElementById("statusMessage");

  // Ensure push notifications are supported
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    statusMessage.innerText =
      "Push notifications are not supported in this browser.";
    return;
  }

  // Register service worker
  navigator.serviceWorker
    .register("sw.js")
    .then((reg) => {
      console.log("Service Worker Registered!", reg);
    })
    .catch((err) => console.error("Service Worker registration failed:", err));

  // Function to handle push notification subscription
  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        statusMessage.innerText =
          "Permission denied. Please allow notifications.";
        return;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
      });

      console.log("Push Subscription:", JSON.stringify(subscription));

      // Extract keys safely
      const keys = extractKeys(subscription);
      if (!keys) {
        throw new Error("Push subscription keys are missing.");
      }

      // Send subscription data to Klaviyo
      registerPushInKlaviyo(keys, subscription.endpoint);
      statusMessage.innerText =
        "Successfully subscribed to push notifications!";
    } catch (error) {
      console.error("Subscription failed:", error);
      statusMessage.innerText =
        "Subscription failed. Check console for details.";
    }
  }

  // Function to extract keys
  function extractKeys(subscription) {
    try {
      const jsonSubscription = subscription.toJSON();
      if (jsonSubscription.keys) {
        return {
          p256dh: jsonSubscription.keys.p256dh,
          auth: jsonSubscription.keys.auth,
        };
      }
    } catch (error) {
      console.error("Error extracting keys:", error);
    }
    return null;
  }

  // Function to send push subscription data to Klaviyo
  function registerPushInKlaviyo(keys, endpoint) {
    klaviyo.identify({
      "Web Push Notification": "Subscribed",
      web_push__endpoint: endpoint,
      web_push__auth: keys.auth,
      web_push__p256dh: keys.p256dh,
    });

    klaviyo.push([
      "track",
      "Subscribed to Web Push",
      {
        url: window.location.href,
        web_push__endpoint: endpoint,
        web_push__auth: keys.auth,
        web_push__p256dh: keys.p256dh,
      },
    ]);
  }

  // Attach click event to subscribe button
  subscribeBtn.addEventListener("click", subscribeToPush);
});
