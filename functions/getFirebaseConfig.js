// Path: functions/getFirebaseConfig.js

export async function onRequest(context) {
  // context.env contains environment variables set in Cloudflare Pages
  const firebaseConfig = {
    apiKey: context.env.FIREBASE_API_KEY,
    authDomain: context.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: context.env.FIREBASE_DATABASE_URL,
    projectId: context.env.FIREBASE_PROJECT_ID,
    storageBucket: context.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: context.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: context.env.FIREBASE_APP_ID,
    measurementId: context.env.FIREBASE_MEASUREMENT_ID
  };

  return new Response(JSON.stringify(firebaseConfig), {
    headers: { 'Content-Type': 'application/json' },
  });
}