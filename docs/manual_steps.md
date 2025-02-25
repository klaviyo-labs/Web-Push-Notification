# 📖 **Manual Setup for Web Push Notifications**

## 🔑 Generating Your VAPID Keys

**VAPID (Voluntary Application Server Identification)** keys are required for secure push notifications. You will need to generate a _public_ and _private_ key to use web push notifications.

Choose one of the two methods below:

    1️⃣ Option 1: Local Setup (Using Node.js & Web-Push Library)

    2️⃣ Option 2: Cloud-Based Setup (Using Napkin.io)

### 1️⃣ Option 1: Local Setup (Node.js)

If you have Node.js installed on your machine, follow these steps:

🔹 **Step 1: Install the Web-Push Library**

_Run the following command in your terminal:_

`npm install -g web-push`

🔹 **Step 2: Generate VAPID Keys**

_Run the command below to generate your public and private VAPID keys:_

`web-push generate-vapid-keys`

🔹 **Step 3: Copy and Store Your Keys**

_Once you run the command, you’ll see an output like this:_

```
Public Key: BO3NGaDn5cXwfg0lINrB3Adql5ds7RMUEFJDB6v7K8GjYrtXWeVTEj8Kfa7ayENu9k7zdsLNz3iBYHMeRlyBHD4
Private Key: I2Q9kJK-E9L6LjTzRh8F8K5Vg6NmAJpmNSbzhy9fDBA
```

**Note** The Private Key should be stored securely and never exposed in frontend code.

### 2️⃣ Option 2: Cloud-Based Setup (Napkin.io)

If you do **not** have Node.js installed, you can generate your VAPID keys using Napkin.io.

🔹 **Step 1: Create a Napkin.io Function**

_Go to Napkin.io, log in and click "Create a New Function" → Select JavaScript._

🔹 **Step 2: Install the `Web-Push` Module**

_Go to the Modules tab and click "Add Module" to install `web-push`._

🔹 **Step 3: Paste the Following Code**

_Inside the Napkin.io function editor, paste the following:_

```js
import webpush from "web-push";

export default async (req, res) => { const vapidKeys = webpush.generateVAPIDKeys();

console.log(Public Key: ${vapidKeys.publicKey}); console.log(Private Key: ${vapidKeys.privateKey});

return res.json({ publicKey: vapidKeys.publicKey, privateKey: vapidKeys.privateKey, }); };
```

🔹 **Step 4: Run the Function**

_Click **"Run"** to generate the **Public** and **Private** VAPID keys._

🔹 **Step 5: Copy and Store Your Keys**

_The function will return output like this:_

```
{ "publicKey": "BO3NGaDn5cXwfg0lINrB3Adql5ds7RMUEFJDB6v7K8GjYrtXWeVTEj8Kfa7ayENu9k7zdsLNz3iBYHMeRlyBHD4", "privateKey": "I2Q9kJK-E9L6LjTzRh8F8K5Vg6NmAJpmNSbzhy9fDBA" }
```

### 📌 Where to Use Your VAPID Keys

| **Key**         | **Where to Use It**                                                          |
| --------------- | ---------------------------------------------------------------------------- |
| **Public Key**  | Used in Frontend (`app.js`), Napkin.io function, and Klaviyo Custom Actions. |
| **Private Key** | Set as **Environment Variables** in Napkin.io or Klaviyo                     |

---

## ⚡ Setting Up Klaviyo CDP/ Custom Actions

1. Create a new Function using CDP Code, or Custom Actions (from a Flow)

2. Add the following variables under the **Environment Variables** section:

   - `VAPID_PUBLIC` → Your **VAPID Public Key**
   - `VAPID_PRIVATE` → Your **VAPID Private Key**
   - `WEB_PUSH_MAILTO` → Your **Admin Email Address**
   - `REDIRECTION_URL` → Your **Klaviyo Hosted Page URL** (if unknown, this can be set to blank for the time being)

3. Install the required **modules**:

   - Go to **Modules** → Click **Add Module**.
   - Install:
     - `"web-push"` _(For sending push notifications)_
     - `"klaviyo-api"` _(For saving new events)_

4. _(optional)_ To enable **click tracking**, set **TRACK_CLICKS** to _true_, and **REDIRECTION_URL** to your Custom Klaviyo Hosted Page URL. This can be found by navigating to Settings > Other > Hosted pages (from your Klaviyo account). The Blog Post walks through how to set this up [here](https://medium.com/p/14a8361eb9f4).

---

## 🚀 Setting Up Napkin.io

1. Log into **[Napkin.io](https://www.napkin.io/)**.
2. Go to **Functions** → **Create a New Function**.
3. Add the **following environment variables** under the **Environment Variables** section:

   - `KLAVIYO_PRIVATE_KEY` → Your **Klaviyo Private API Key**
   - `VAPID_PUBLIC` → Your **VAPID Public Key**
   - `VAPID_PRIVATE` → Your **VAPID Private Key**
   - `WEB_PUSH_MAILTO` → Your **Admin Email Address**
   - `REDIRECTION_URL` → Your **Klaviyo Hosted Page URL (if unknown, this can be set to blank)**

4. Install the required **modules**:

   - Go to **Modules** → Click **Add Module**.
   - Install:
     - `"web-push"` _(For sending push notifications)_
     - `"klaviyo-api"` _(For communicating with Klaviyo)_

5. _(optional)_ To enable **click tracking**, set **TRACK_CLICKS** to _true_, and **REDIRECTION_URL** to your Custom Klaviyo Hosted Page URL. This can be found by navigating to Settings > Other > Hosted pages (from your Klaviyo account). The Blog Post walks through how to set this up [here](https://medium.com/p/14a8361eb9f4).

**Note:** Remember to **deploy** the Napkin function.

---

## 🌍 Setting Up Your Website

1. **Search and replace placeholder Public Key** from `index.html`:
   ```js
   "//static.klaviyo.com/onsite/js/klaviyo.js?company_id=[KLAVIYO_PUBLIC_KEY]";
   ```
2. **Replace the Public VAPID key** in `app.js`:
   ```js
   applicationServerKey: "YOUR_PUBLIC_VAPID_KEY",
   ```
3. **Deploy your website.**

---

## 📡 Setting Up Klaviyo Webhook

1. Go to Klaviyo → Flows.
2. Create a New Webhook Action in your desired flow.
3. Set the `destination URL` to your Napkin.io function URL (making sure that the function has been deployed).
