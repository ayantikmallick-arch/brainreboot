import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdmin(): {
  app: App | null;
  auth: Auth | null;
  db: Firestore | null;
  hasCredentials: boolean;
} {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return { app: adminApp, auth: adminAuth, db: adminDb, hasCredentials: true };
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "brainflow-2f214";

  // Priority 1: Full JSON credential from FIREBASE_SERVICE_ACCOUNT_KEY
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      return { app: adminApp, auth: adminAuth, db: adminDb, hasCredentials: true };
    } catch (err: any) {
      console.error("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err?.message || err);
    }
  }

  // Priority 2: Individual variables FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      return { app: adminApp, auth: adminAuth, db: adminDb, hasCredentials: true };
    } catch (err: any) {
      console.error("[Firebase Admin] Failed to initialize with cert variables:", err?.message || err);
    }
  }

  // Priority 3: Default application initialization (works in Google Cloud environments)
  try {
    adminApp = initializeApp({ projectId });
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    return { app: adminApp, auth: adminAuth, db: adminDb, hasCredentials: true };
  } catch {
    return { app: null, auth: null, db: null, hasCredentials: false };
  }
}

/**
 * Check if an email is already registered in Firebase Authentication
 */
export async function checkEmailAlreadyRegistered(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const { auth: adminAuth, hasCredentials } = getFirebaseAdmin();

  // 1. Try Firebase Admin SDK if credentials exist
  if (hasCredentials && adminAuth) {
    try {
      const user = await adminAuth.getUserByEmail(normalized);
      if (user && user.uid) {
        return true;
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        return false;
      }
      // If permission error or other code, fall through to REST API check
    }
  }

  // 2. High-reliability fallback via Firebase Auth REST API (Identity Toolkit)
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAl5gfvzb0zRUBnYxzrrIabkhONMIKbgLY";

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: normalized,
          continueUri: "https://brainflowai.in",
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.allProviders) && data.allProviders.length > 0) {
        return true;
      }
      if (data.registered === true) {
        return true;
      }
    }
  } catch (restErr) {
    // If check fails due to network, proceed safely
  }

  return false;
}

/**
 * Create a Firebase user account after successful OTP verification.
 * Returns either a Firebase custom token (preferred) or account creation status.
 */
export async function createVerifiedFirebaseUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<{
  success: boolean;
  uid?: string;
  customToken?: string;
  idToken?: string;
  error?: string;
}> {
  const normalized = email.trim().toLowerCase();
  const { auth: adminAuth, hasCredentials } = getFirebaseAdmin();

  // Method 1: Firebase Admin SDK (Creates user with emailVerified=true and returns customToken)
  if (hasCredentials && adminAuth) {
    try {
      const userRecord = await adminAuth.createUser({
        email: normalized,
        password,
        displayName: name.trim(),
        emailVerified: true,
      });

      // Generate single-use custom auth token for immediate client sign-in
      const customToken = await adminAuth.createCustomToken(userRecord.uid);

      return {
        success: true,
        uid: userRecord.uid,
        customToken,
      };
    } catch (err: any) {
      console.error("[Firebase Admin Create User Error]:", err?.code || err?.message);
      if (err.code === "auth/email-already-exists") {
        return { success: false, error: "This email address is already registered." };
      }
      // If service account lacks permission, fall through to REST API
    }
  }

  // Method 2: Firebase Auth REST API (Works directly with Web API Key)
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAl5gfvzb0zRUBnYxzrrIabkhONMIKbgLY";

  try {
    const signupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      const errorMsg = signupData?.error?.message || "Failed to create account.";
      if (errorMsg.includes("EMAIL_EXISTS")) {
        return { success: false, error: "This email address is already registered." };
      }
      return { success: false, error: errorMsg };
    }

    const { idToken, localId } = signupData;

    // Update display name via Identity Toolkit
    if (idToken && name.trim()) {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            displayName: name.trim(),
            returnSecureToken: true,
          }),
        }
      ).catch(() => {});
    }

    return {
      success: true,
      uid: localId,
      idToken,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to communicate with authentication service.",
    };
  }
}
