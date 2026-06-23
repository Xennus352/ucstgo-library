self.addEventListener("push", function (event) {
  // Guard check to ensure there is actually data in the push event
  if (!event.data) return;

  try {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: "/images/brand.png",
        badge: "/images/brand.png",
      }),
    );
  } catch (error) {
    console.error("Error parsing push notification data:", error);
  }
});
