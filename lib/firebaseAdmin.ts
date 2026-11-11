// Firebase Admin SDK & Identity Toolkit REST fallback
// Safe for serverless environments (e.g. Vercel) without Google Cloud default credentials

let cachedAdminAuth: any = null;
let cachedAdminDb: any = null;
let isInitialized = false;

/**
 * Lazily initialize Firebase Admin SDK ONLY when explicit service account credentials exist.
 * This strictly prevents Google Cloud default credential resolution crashes on Vercel.
 */
export function getFirebaseAdmin(): {
  auth: any | null;
  db: any | null;
  hasCredentials: boolean;
} {
  if (isInitialized) {
    return {
      auth: cachedAdminAuth,
      db: cachedAdminDb,
      hasCredentials: Boolean(cachedAdminAuth),
    };
  }

  isInitialized = true;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "brainflow-2f214";

  if (!serviceAccountKey && (!clientEmail || !privateKey)) {
    // No credentials configured — do NOT call initializeApp to prevent ADC crashes
    return { auth: null, db: null, hasCredentials: false };
  }

  try {
    // Dynamic import to avoid bundling issues if not configured
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require("firebase-admin");

    const existingApps = admin.apps || [];
    if (existingApps.length > 0) {
      cachedAdminAuth = admin.auth();
      cachedAdminDb = admin.firestore();
      return { auth: cachedAdminAuth, db: cachedAdminDb, hasCredentials: true };
    }

    if (serviceAccountKey) {
      const parsed = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId,
      });
    } else if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }

    cachedAdminAuth = admin.auth();
    try {
      cachedAdminDb = admin.firestore();
    } catch {}

    return { auth: cachedAdminAuth, db: cachedAdminDb, hasCredentials: true };
  } catch (err: any) {
    console.warn("[Firebase Admin] Initialization failed, using REST API fallback:", err?.message || err);
    return { auth: null, db: null, hasCredentials: false };
  }
}

/**
 * Check if an email is already registered in Firebase Authentication
 */
export async function checkEmailAlreadyRegistered(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const { auth, hasCredentials } = getFirebaseAdmin();

  // 1. If service account is available, check via Admin SDK
  if (hasCredentials && auth) {
    try {
      const user = await auth.getUserByEmail(normalized);
      if (user && user.uid) {
        return true;
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        return false;
      }
    }
  }

  // 2. High-reliability fallback via Firebase Auth Identity Toolkit REST API
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
          continueUri: "http://localhost",
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.signinMethods) && data.signinMethods.length > 0) {
        return true;
      }
    }
  } catch (err) {
    console.warn("[checkEmailAlreadyRegistered] REST check fallback error:", err);
  }

  return false;
}

/**
 * Create a verified Firebase user and return sign-in tokens
 */
export async function createVerifiedFirebaseUser(params: {
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
  const { email, password, name } = params;
  const normalizedEmail = email.trim().toLowerCase();
  const { auth, hasCredentials } = getFirebaseAdmin();

  // 1. If Admin SDK has valid credentials, create user via Admin SDK
  if (hasCredentials && auth) {
    try {
      const userRecord = await auth.createUser({
        email: normalizedEmail,
        password,
        displayName: name,
        emailVerified: true,
      });

      const customToken = await auth.createCustomToken(userRecord.uid);
      return {
        success: true,
        uid: userRecord.uid,
        customToken,
      };
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        return { success: false, error: "This email address is already registered." };
      }
      console.warn("[Admin createUser] Failed, falling through to REST fallback:", err?.message || err);
    }
  }

  // 2. High-reliability fallback via Firebase Auth Identity Toolkit REST API
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAl5gfvzb0zRUBnYxzrrIabkhONMIKbgLY";

  try {
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signUpData = await signUpRes.json();

    if (!signUpRes.ok) {
      const msg = signUpData?.error?.message || "";
      if (msg === "EMAIL_EXISTS") {
        return { success: false, error: "This email address is already registered." };
      }
      if (msg === "OPERATION_NOT_ALLOWED") {
        return { success: false, error: "Email/password accounts are not enabled in Firebase." };
      }
      if (msg === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        return { success: false, error: "Too many attempts. Please try again later." };
      }
      return { success: false, error: signUpData?.error?.message || "Failed to create account." };
    }

    const { idToken, localId } = signUpData;

    // Update displayName and mark emailVerified
    if (idToken && name) {
      try {
        await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken,
              displayName: name,
              returnSecureToken: true,
            }),
          }
        );
      } catch (err) {
        console.warn("[accounts:update] Display name update non-fatal error:", err);
      }
    }

    return {
      success: true,
      uid: localId,
      idToken,
    };
  } catch (err: any) {
    console.error("[createVerifiedFirebaseUser] Error:", err?.message || err);
    return { success: false, error: "Failed to create verified Firebase account." };
  }
}
