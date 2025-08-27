import admin from "firebase-admin";
const hasCreds = !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;
if (!hasCreds) {
    console.warn("[firebase] Credenciais ausentes; inicialização ignorada (ok em dev/local).");
}
if (hasCreds && admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}
export const db = hasCreds ? admin.firestore() : undefined;
export const fcm = hasCreds ? admin.messaging() : undefined;
