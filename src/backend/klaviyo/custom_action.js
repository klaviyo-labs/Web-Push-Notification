import { Events } from "klaviyo";
import webpush from "web-push";

const message = {
  title: "Example Title!",
  body: "Text Body!",
  url: "https://www.klaviyo.com?utm_campaign=example",
  img: "https://www.klaviyo.com/wp-content/uploads/2022/09/Klaviyo_primary_mark_poppy-67-550x226-1.webp",
  flow: "Basic Push Notification Example",
};

// Constants
const KLAVIYO_SUCCESS_EVENT_NAME = "Sent Web Push Notification";
const KLAVIYO_FAILED_EVENT_NAME = "Failed to Deliver Web Push Notification";
const WEB_PUSH_MAILTO_EMAIL_ADDRESS = process.env.WEB_PUSH_MAILTO;
const KLAVIYO_HOSTED_PAGE_URL = process.env.REDIRECTION_URL;
const TRACK_CLICKS = false;

// VAPID Keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC,
  privateKey: process.env.VAPID_PRIVATE,
};

// Set VAPID details for web push
const mailto = `mailto:${WEB_PUSH_MAILTO_EMAIL_ADDRESS}`;
webpush.setVapidDetails(mailto, vapidKeys.publicKey, vapidKeys.privateKey);

// Helper function to create Klaviyo event payload
const createKlaviyoPayload = (eventName, profileId, msg = "") => ({
  data: {
    type: "event",
    attributes: {
      properties: { message: msg },
      metric: {
        data: {
          type: "metric",
          attributes: { name: eventName },
        },
      },
      profile: {
        data: {
          type: "profile",
          id: profileId,
        },
      },
    },
  },
});

// Helper function to encode URL
const encodeUrl = (url) => {
  return Buffer.from(url)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Helper function to generate notification URL
const generateUrl = (url, profile, flow) => {
  if (TRACK_CLICKS) {
    const separator = KLAVIYO_HOSTED_PAGE_URL.includes("?") ? "&" : "?";
    return `${KLAVIYO_HOSTED_PAGE_URL}${separator}redirect=${encodeUrl(
      url
    )}&p=${profile}&f=${flow}`;
  }
  return url;
};

// Main handler function
export default async (event, profile, context) => {
  const payload = {
    title: message.title,
    body: message.body,
    url: generateUrl(message.url, profile.data.id, message.flow),
    image: message.img,
    profile: profile.data.id,
    flow: message.flow,
  };

  console.log("url = " + payload.url);
  const pushSubscription = {
    endpoint: profile.data.attributes.properties.web_push__endpoint,
    keys: {
      auth: profile.data.attributes.properties.web_push__auth,
      p256dh: profile.data.attributes.properties.web_push__p256dh,
    },
  };

  try {
    // Send the push notification
    const response = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    console.log("Notification sent successfully!", response);

    // Send success event to Klaviyo
    let klaviyoPayload = createKlaviyoPayload(
      KLAVIYO_SUCCESS_EVENT_NAME,
      profile.data.id,
      payload
    );
    let klaviyoResponse = await Events.createEvent(klaviyoPayload);
    console.log(`Sent event to Klaviyo`);
  } catch (error) {
    console.error("Error sending notification");
    // Send failure event to Klaviyo
    let klaviyoPayload = createKlaviyoPayload(
      KLAVIYO_FAILED_EVENT_NAME,
      profile.data.id,
      error.toString()
    );
    try {
      let klaviyoResponse = await Events.createEvent(klaviyoPayload);
      console.log(`Sent failure event to Klaviyo`);
    } catch (klaviyoError) {
      console.error("Error sending event to Klaviyo");
    }
  }
};
