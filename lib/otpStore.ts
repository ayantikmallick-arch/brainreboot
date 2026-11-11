import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getFirebaseAdmin } from "./firebaseAdmin";

export interface PendingVerificationRecord {
  id: string;
  email: string;
  name: string;
  otpHashed: string;
  salt: string;
  encryptedPassword: string;
  iv: string;
  tag: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  resendAfter: number;
  used: boolean;
}

// Secret key for AES-256-GCM password encryption
function getEncryptionKey(): Buffer {
  const secret =
    process.env.OTP_ENCRYPTION_SECRET ||
    process.env.RESEND_API_KEY ||
    process.env.FIREBASE_PROJECT_ID ||
    "brainflow-secure-encryption-key-v1-32bytes-long";

  return crypto.createHash("sha256").update(secret).digest();
}

function encryptPassword(password: string): { encrypted: string; iv: string; tag: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

export function decryptPassword(encrypted: string, ivHex: string, tagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Generate cryptographically secure random 6-digit OTP
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// Salt and hash the OTP with SHA-256
export function hashOtp(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(otp + salt).digest("hex");
}

function getEmailDocKey(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// Local fallback store path for offline development when service account credentials are not configured
const LOCAL_DEV_STORE_PATH = path.join(process.cwd(), ".otp_local_store.json");

function readLocalDevStore(): Record<string, PendingVerificationRecord> {
  try {
    if (fs.existsSync(LOCAL_DEV_STORE_PATH)) {
      const data = fs.readFileSync(LOCAL_DEV_STORE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch {}
  return {};
}

function writeLocalDevStore(store: Record<string, PendingVerificationRecord>) {
  try {
    fs.writeFileSync(LOCAL_DEV_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {}
}

/**
 * Save or update a pending verification record in Firestore (with local dev fallback)
 */
export async function savePendingVerification(
  params: {
    email: string;
    name: string;
    password: string;
    otp: string;
  }
): Promise<{ success: boolean; verificationId: string; expiresAt: number; resendAfter: number; error?: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHashed = hashOtp(params.otp, salt);
  const { encrypted, iv, tag } = encryptPassword(params.password);

  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration
  const resendAfter = now + 60 * 1000; // 60s cooldown
  const verificationId = crypto.randomUUID();

  const record: PendingVerificationRecord = {
    id: verificationId,
    email: normalizedEmail,
    name: params.name.trim(),
    otpHashed,
    salt,
    encryptedPassword: encrypted,
    iv,
    tag,
    attempts: 0,
    createdAt: now,
    expiresAt,
    resendAfter,
    used: false,
  };

  const docKey = getEmailDocKey(normalizedEmail);
  const { db, hasCredentials } = getFirebaseAdmin();

  // Try saving to persistent Firestore
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).set(record);
      return { success: true, verificationId, expiresAt, resendAfter };
    } catch (err: any) {
      console.warn("[OTP Store] Firestore write warning, using local dev persistence fallback:", err?.message || err);
    }
  }

  // Local fallback persistence for development
  const localStore = readLocalDevStore();
  localStore[docKey] = record;
  writeLocalDevStore(localStore);

  return { success: true, verificationId, expiresAt, resendAfter };
}

/**
 * Fetch a pending verification record by email
 */
export async function getPendingVerification(email: string): Promise<PendingVerificationRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const docKey = getEmailDocKey(normalizedEmail);
  const { db, hasCredentials } = getFirebaseAdmin();

  if (hasCredentials && db) {
    try {
      const snap = await db.collection("pending_verifications").doc(docKey).get();
      if (snap.exists) {
        return snap.data() as PendingVerificationRecord;
      }
    } catch (err: any) {
      // Fall through to local store
    }
  }

  const localStore = readLocalDevStore();
  return localStore[docKey] || null;
}

/**
 * Record a failed attempt
 */
export async function incrementFailedAttempt(email: string): Promise<{ remainingAttempts: number; isLocked: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  const docKey = getEmailDocKey(normalizedEmail);
  const record = await getPendingVerification(normalizedEmail);

  if (!record) {
    return { remainingAttempts: 0, isLocked: true };
  }

  const newAttempts = record.attempts + 1;
  const isLocked = newAttempts >= 5;
  const remainingAttempts = Math.max(0, 5 - newAttempts);

  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).update({
        attempts: newAttempts,
      });
    } catch {}
  }

  const localStore = readLocalDevStore();
  if (localStore[docKey]) {
    localStore[docKey].attempts = newAttempts;
    writeLocalDevStore(localStore);
  }

  return { remainingAttempts, isLocked };
}

/**
 * Mark verification record as used/completed
 */
export async function markVerificationUsed(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const docKey = getEmailDocKey(normalizedEmail);
  const { db, hasCredentials } = getFirebaseAdmin();

  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).update({
        used: true,
      });
      // Optionally delete after brief delay or mark used
      await db.collection("pending_verifications").doc(docKey).delete().catch(() => {});
    } catch {}
  }

  const localStore = readLocalDevStore();
  if (localStore[docKey]) {
    delete localStore[docKey];
    writeLocalDevStore(localStore);
  }
}

/**
 * Update an existing record with a newly generated OTP (for resend)
 */
export async function refreshPendingOtp(
  email: string,
  newOtp: string
): Promise<{ success: boolean; resendAfter: number; expiresAt: number; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await getPendingVerification(normalizedEmail);

  if (!record) {
    return { success: false, resendAfter: 0, expiresAt: 0, error: "No pending registration found for this email." };
  }

  const now = Date.now();
  if (now < record.resendAfter) {
    const remainingSeconds = Math.ceil((record.resendAfter - now) / 1000);
    return {
      success: false,
      resendAfter: record.resendAfter,
      expiresAt: record.expiresAt,
      error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
    };
  }

  const newSalt = crypto.randomBytes(16).toString("hex");
  const newOtpHashed = hashOtp(newOtp, newSalt);
  const expiresAt = now + 5 * 60 * 1000;
  const resendAfter = now + 60 * 1000;

  const updatedRecord: PendingVerificationRecord = {
    ...record,
    otpHashed: newOtpHashed,
    salt: newSalt,
    attempts: 0, // reset attempts on newly issued code
    createdAt: now,
    expiresAt,
    resendAfter,
    used: false,
  };

  const docKey = getEmailDocKey(normalizedEmail);
  const { db, hasCredentials } = getFirebaseAdmin();

  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).set(updatedRecord);
      return { success: true, resendAfter, expiresAt };
    } catch {}
  }

  const localStore = readLocalDevStore();
  localStore[docKey] = updatedRecord;
  writeLocalDevStore(localStore);

  return { success: true, resendAfter, expiresAt };
}
