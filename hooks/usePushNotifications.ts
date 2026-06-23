function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) throw new Error("Missing VAPID key");

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

let subscribed = false;

export const subscribeUser = async () => {
  if (subscribed) return;
  subscribed = true;

  try {
    const registration =
      await navigator.serviceWorker.getRegistration("/sw.js");

    if (!registration) return;

    const existing = await registration.pushManager.getSubscription();
    if (existing) return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey!),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.error("Push failed:", err);
  }
};
