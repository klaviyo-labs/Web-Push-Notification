document.addEventListener("DOMContentLoaded", function () {
  const subscribeBtn = document.getElementById("subscribeBtn");

  // Ensure push notifications are supported
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications are not supported in this browser.");
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
        console.log("Permission denied. Please allow notifications.");
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
    } catch (error) {
      console.error("Subscription failed:", error);
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
    let partySize = document.getElementById("size").value;
    let preferredDate = document.getElementById("preferredDate").value;
    let preferredampm = document.getElementById("ampm").value;

    klaviyo.identify({
      "Web Push Notification": "Subscribed",
      web_push__endpoint: endpoint,
      web_push__auth: keys.auth,
      web_push__p256dh: keys.p256dh,
    });

    klaviyo.push([
      "track",
      "Subscribed For Restaurant Reservation Alert",
      {
        url: window.location.href,
        web_push__endpoint: endpoint,
        web_push__auth: keys.auth,
        web_push__p256dh: keys.p256dh,
        "Preferred Date": preferredDate,
        "AM or PM": preferredampm,
        "Party Size": partySize,
      },
    ]);
  }

  // Attach click event to subscribe button
  subscribeBtn.addEventListener("click", subscribeToPush);
});
