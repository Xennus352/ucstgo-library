import webpush from "@/lib/webpush";

export const sendPush = async (subscriptions: any[], title: string, message: string) => {
  for (const sub of subscriptions) {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
      },
      JSON.stringify({
        title,
        message,
      })
    );
  }
};