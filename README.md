# **Web Push Notifications with Klaviyo**

---

## 📌 Overview

This repository provides a complete solution for implementing **web push notifications** with Klaviyo, enabling businesses to engage users **in real time through their browsers**.

This Repo has an accompanying [Blog Post]([https://medium.com/p/14a8361eb9f4](https://medium.com/klaviyo-developers/solution-recipe-25-how-to-trigger-web-push-notifications-through-klaviyo-14a8361eb9f4)) which goes into greater detail regarding business use cases, techincal steps and common gotchas.

The implementation supports multiple approaches:  
✅ **Klaviyo Custom Actions/CDP** _(used to trigger web push directly from Klaviyo)_  
✅ **Klaviyo Hosted Pages** _(used to track clicks)_  
✅ **Middleware via Napkin.io** _(used to manage push notifications centrally)_

With this guide, you'll be able to:

- **Request user permission** for push notifications.
- **Store subscription data** in Klaviyo.
- **Send push notifications** via Klaviyo or middleware.
- **Track engagement** using Klaviyo-hosted pages.

---

## 📂 Folder Structure

```
├── README.md                             # Main documentation file
├── docs                                  # Documentation folder
│   └── manual_steps.md                   # Detailed manual steps for setup and configuration
└── src                                   # Source code directory
    ├── backend                           # Backend integration code split by tool
    │   ├── klaviyo                       # Klaviyo-specific scripts
    │   │   ├── custom_action.js          # Custom Action/CDP Code for sending push notifications
    │   │   ├── custom_hosted_page.html   # Hosted Klaviyo page for click tracking
    │   │   └── napkin_io_webhook.json    # Napkin.io webhook configuration
    │   └── middleware                    # Middleware scripts
    │       └── napkin_io_function.js     # Napkin.io serverless function for sending push notifications
    └── frontend                          # Frontend (client-side) implementation
        ├── demo                          # Demo version of the restaurant booking site
        │   ├── css                       # CSS files for the demo
        │   │   └── styles.css            # Main stylesheet for demo page
        │   ├── img                       # Images for the demo
        │   │   ├── image-1.jpg
        │   │   ├── logo.png              # Demo logo
        │   │   ├── small-img-1.jpg
        │   │   ├── small-img-2.jpg
        │   │   └── small-img-3.jpg
        │   ├── index.html                # Demo restaurant booking site
        │   ├── js                        # JavaScript files for demo restaurant booking site
        │   │   ├── app.js                # Demo main JavaScript file
        │   │   └── cart.js               # Demo JavaScript file for images
        │   └── sw.js                     # Service Worker for demo restaurant booking site
        └── test                          # Vanila test site
            ├── app.js                    # Vanila test JavaScript file
            ├── index.html                # Vanila test page
            ├── logo.png                  # Demo logo
            ├── styles.css                # Test stylesheet
            └── sw.js                     # Service Worker for test site
```

---

## 🛠 Prerequisites

Before you begin, ensure you have:

- **[Your Klaviyo Site ID/Public API Key](https://help.klaviyo.com/hc/en-us/articles/115005062267)**
- **[Generated VAPID Keys](https://github.com/klaviyo-labs/Web-Push-Notification/blob/main/docs/manual_steps.md#-generating-your-vapid-keys)** _(for secure push notifications)_
- **[Custom Klaviyo-hosted pages enabled](https://help.klaviyo.com/hc/en-us/articles/360057676272)** _(optional, for tracking clicks)_

---

## 📜 Required Environment Variables

You will need to manually add a number of **Environment Variables** and **Modules** as part of the configuration. These dependencies are described [here](https://github.com/klaviyo-labs/Web-Push-Notification/blob/main/docs/manual_steps.md#%EF%B8%8F-setting-up-klaviyo-cdp-custom-actions) in depth.

Nonetheless, an overview has also been made available below:

### 📄 **Napkin.io (Middleware)**

Creating a JavaScript function; and set the following environment variables in Napkin.io:

- `KLAVIYO_PRIVATE_KEY` → Your **Klaviyo Private API Key**
- `VAPID_PUBLIC_KEY` → Your **Web Push VAPID Public Key**
- `VAPID_PRIVATE_KEY` → Your **Web Push VAPID Private Key**
- `WEB_PUSH_MAILTO` → Your **Admin Email Address** (used for VAPID)

Install the following modules:

- `"web-push"` _(For sending push notifications)_
- `"klaviyo-api"` _(For communicating with Klaviyo)_

**Note:** Remember to **deploy** the Napkin function.

### 🌍 **Frontend (Website)**

Update your website’s frontend configuration:

- `KLAVIYO_PUBLIC_KEY` → Your **Klaviyo Public API Key**
- `VAPID_PUBLIC_KEY` → Your **Web Push VAPID Public Key**

### ⚡ **Klaviyo Custom Actions/ Klaviyo CDP**

You are able to track clicks by configuring:

- `KLAVIYO_HOSTED_PAGE_URL` → The **Klaviyo Hosted Page URL** for tracking clicks.
- `TRACK_CLICKS = true` → Redirection flag used to track when a visitor clicks a notification.

Install the following modules:

- `"web-push"` _(For sending push notifications)_
- `"klaviyo-api"` _(For saving new Klaviyo events)_

### 📡 **Klaviyo Webhook**

Set your webhook's _endpoint_:

- Set the `destination URL` to your Napkin.io function URL

---

## 🚀 How It Works

### **Step 1: Identify Users in Klaviyo**

The frontend (`index.html`) ensures that a **known user is identified before requesting push permissions**.

```js
klaviyo.isIdentified().then((isIdentified) => {
  if (isIdentified) {
    subscribeBtn.disabled = false;
  } else {
    statusMessage.innerText =
      "Please identify yourself first. Add ?utm_email=your.email@klaviyo-demo.com to the URL in your browser's address bar, press Enter, and then refresh the page.";
  }
});
```

### **Step 2: Request Push Permissions**

Users **grant permission for push notifications**, and their subscription details are stored:

```js
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
```

### **Step 3: Store Subscription in Klaviyo**

Once a user subscribes, their subscription details must be sent to Klaviyo. A Service Worker is required to manage push notifications in the background. This ensures that notifications are received even when the browser is not open.
The `registerPushInKlaviyo` function **sends the subscription data to Klaviyo**, linking it to their profile:

```js
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
```

### **Step 4: Register the Service Worker**

A **Service Worker** is required to listen for and handle push notifications, even when the user is not actively on the website.

```js
self.addEventListener("push", (event) => {
  const notification = event.data.json();

  // Prepare options for the notification
  const options = {
    body: notification.body,
    icon: "img/logo.png", // Replace with your logo URL
    data: {
      notifURL: notification.url, // URL to open when notification is clicked
    },
  };

  // Check if the image is provided, and add it to the notification options
  if (notification.image && notification.image.trim() !== "") {
    options.image = notification.image;
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  // Log the data object to debug
  console.log("Notification click event data:", event.notification.data);

  event.notification.close(); // Close the notification when clicked
  event.waitUntil(
    clients.openWindow(event.notification.data.notifURL) // Use the correct property name
  );
});
```

### **Step 5: Sending Push Notifications**

Once a visitor is subscribed and their data is stored in Klaviyo, you can **trigger push notifications** using one of the methods below:

⚡ **_Option 1: Directly from Klaviyo Custom Actions/CDP Code_**

Uses `custom_action.js` to trigger push notifications from a Klaviyo Flow.

📌 **_Option 2: Using Middleware (Napkin.io)_**

`napkin_io_function.js` acts as a serverless function to send notifications.

This can be triggered by making a call to Napkin.io through a webhook in Klaviyo:

```json
{
  "flow": "Example send",
  "title": "Hello World From Klaviyo",
  "body": "Klaviyo body text",
  "url": "https://developers.klaviyo.com/en",
  "image": "https://images.app.goo.gl/knsbCPTrdz4dhkoH9",
  "profile": "{{ person.KlaviyoID }}",
  "endpoint": "{{ person.web_push__endpoint|default:'' }}",
  "p256dh": "{{ person.web_push__p256dh|default:'' }}",
  "auth": "{{ person.web_push__auth|default:'' }}"
}
```

## 📌 Troubleshooting

| **Issue**                               | **Solution**                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Push notifications not working?**     | Ensure **VAPID keys** are correctly set.                                                                                                                            |
| **Klaviyo event not logging?**          | Check **Klaviyo API keys** are valid and **Klaviyo Developer Logs**.                                                                                                |
| **Notifications not appearing?**        | Confirm that **notification permissions** are enabled in browser settings.                                                                                          |
| **Notifications not displaying?**       | Check your **computer's notification settings** and ensure browser notifications are **allowed**.                                                                   |
| **Click tracking not working?**         | Confirm **KLAVIYO_HOSTED_PAGE_URL** is correct and **TRACK_CLICKS** is set to `true`.                                                                               |
| **Subscription keys undefined?**        | Ensure the **subscription object** is correctly structured (`toJSON()`).                                                                                            |
| **The Service Worker is not updating?** | Clear **Browser Cache** and manually reset the Service Worker through your browser’s **Developer Tools** (usually under _Application > Service Workers_ in Chrome). |

## 👏 Credits

This project was created by [Samson Odelowo](https://www.linkedin.com/in/samson-odelowo/), a Solution Architect at Klaviyo, to provide a seamless Web Push Notification integration for Klaviyo customers.

For more Klaviyo technical insights, visit:

🔗 [How to trigger Web Push Notifications through Klaviyo](https://medium.com/klaviyo-developers/solution-recipe-25-how-to-trigger-web-push-notifications-through-klaviyo-14a8361eb9f4)

🔗 [Klaviyo Developers Blog](https://medium.com/klaviyo-developers)

## 🎉 Contributing

🔧 If you find a bug or have an improvement, feel free to submit a pull request or open an issue.

## 📜 Licence

This project is licensed under the MIT Licence.

## 🔥 Get Started Now!

🚀 Enjoy sending real-time push notifications with Klaviyo!
