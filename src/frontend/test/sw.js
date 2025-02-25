self.addEventListener("push", (event) => {
  const notification = event.data.json();

  // Prepare options for the notification
  const options = {
    body: notification.body,
    icon: "[logo location]",
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
