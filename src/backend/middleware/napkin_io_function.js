import { ConfigWrapper, Events } from "klaviyo-api";
import webpush from "web-push";
/**
 * @param {NapkinRequest} req
 * @param {NapkinResponse} res
 */

// Initialise Klaviyo API configuration
ConfigWrapper(process.env.KLAVIYO_PK);

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
export default async (req, res) => {
  const { title, body, url, profile, flow, endpoint, auth, p256dh, image } =
    req.body;

  const payload = {
    title,
    body,
    url: generateUrl(url, profile, flow),
    image: image || "",
  };

  const pushSubscription = {
    endpoint,
    keys: { auth, p256dh },
  };

  try {
    // Send the push notification
    const response = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    console.log("Notification sent successfully!", response);

    // Send success event to Klaviyo
    const klaviyoPayload = createKlaviyoPayload(
      KLAVIYO_SUCCESS_EVENT_NAME,
      profile
    );
    const klaviyoResponse = await Events.createEvent(klaviyoPayload);
    console.log(`Sent event to Klaviyo: ${klaviyoResponse}`);
  } catch (error) {
    console.error("Error sending notification:", error);

    // Send failure event to Klaviyo
    const klaviyoPayload = createKlaviyoPayload(
      KLAVIYO_FAILED_EVENT_NAME,
      profile,
      error.toString()
    );
    try {
      const klaviyoResponse = await Events.createEvent(klaviyoPayload);
      console.log(`Sent failure event to Klaviyo: ${klaviyoResponse}`);
    } catch (klaviyoError) {
      console.error("Error sending event to Klaviyo:", klaviyoError);
    }
  }

  res.json({ status: "complete" });
};
