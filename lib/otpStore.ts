import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { getFirebaseAdmin } from "./firebaseAdmin";

export interface PendingVerificationRecord {
  id: string;
  email: string;
  name: string;
  password: string;
  otpHashed: string;
  salt: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  resendAfter: number;
  used: boolean;
}

// 32-byte secret key for AES-256-GCM encryption
function getEncryptionKey(): Buffer {
  const secret =
    process.env.OTP_ENCRYPTION_SECRET ||
    process.env.RESEND_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "brainflow-secure-encryption-key-v1-32bytes-long";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a verification record into a tamper-proof AES-256-GCM token.
 */
export function sealVerificationToken(record: PendingVerificationRecord): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const payload = JSON.stringify(record);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypt and verify the AES-256-GCM verification token.
 */
export function unsealVerificationToken(token: string): PendingVerificationRecord | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, tagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const record: PendingVerificationRecord = JSON.parse(decrypted);

    if (!record.email || !record.otpHashed || !record.salt) {
      return null;
    }

    return record;
  } catch {
    return null;
  }
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

// In-memory cache for fast access within the same serverless instance
const memoryStore = new Map<string, PendingVerificationRecord>();

// Safe writable path on Vercel / serverless (/tmp) or local OS tmpdir
const TMP_STORE_PATH = path.join(os.tmpdir(), "brainflow_pending_verifications.json");

function readDiskCache(): Record<string, PendingVerificationRecord> {
  try {
    if (fs.existsSync(TMP_STORE_PATH)) {
      const data = fs.readFileSync(TMP_STORE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch {}
  return {};
}

function writeDiskCache(store: Record<string, PendingVerificationRecord>) {
  try {
    fs.writeFileSync(TMP_STORE_PATH, JSON.stringify(store), "utf8");
  } catch {}
}

/**
 * Save or update a pending verification record
 */
export async function savePendingVerification(params: {
  email: string;
  name: string;
  password: string;
  otp: string;
}): Promise<{
  success: boolean;
  verificationToken: string;
  verificationId: string;
  expiresAt: number;
  resendAfter: number;
}> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHashed = hashOtp(params.otp, salt);

  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiration
  const resendAfter = now + 60 * 1000; // 60s cooldown
  const verificationId = crypto.randomUUID();

  const record: PendingVerificationRecord = {
    id: verificationId,
    email: normalizedEmail,
    name: params.name.trim(),
    password: params.password,
    otpHashed,
    salt,
    attempts: 0,
    createdAt: now,
    expiresAt,
    resendAfter,
    used: false,
  };

  const docKey = getEmailDocKey(normalizedEmail);

  // 1. Update memory cache
  memoryStore.set(docKey, record);

  // 2. Update /tmp disk cache
  const disk = readDiskCache();
  disk[docKey] = record;
  writeDiskCache(disk);

  // 3. Update Firestore if credentials exist
  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).set(record);
    } catch (err: any) {
      console.warn("[Firestore] Non-fatal write warning:", err?.message || err);
    }
  }

  // 4. Seal into AES-256-GCM stateless token
  const verificationToken = sealVerificationToken(record);

  return {
    success: true,
    verificationToken,
    verificationId,
    expiresAt,
    resendAfter,
  };
}

/**
 * Fetch a pending verification record by email or token
 */
export async function getPendingVerification(
  emailOrDocKey: string,
  token?: string | null
): Promise<PendingVerificationRecord | null> {
  // If an encrypted token is provided, verify and unseal it
  if (token) {
    const unsealed = unsealVerificationToken(token);
    if (unsealed) {
      return unsealed;
    }
  }

  const normalized = emailOrDocKey.trim().toLowerCase();
  const docKey = normalized.includes("@") ? getEmailDocKey(normalized) : normalized;

  // 1. Check memory store
  if (memoryStore.has(docKey)) {
    const record = memoryStore.get(docKey)!;
    if (Date.now() <= record.expiresAt) {
      return record;
    }
    memoryStore.delete(docKey);
  }

  // 2. Check /tmp disk cache
  const disk = readDiskCache();
  if (disk[docKey]) {
    const record = disk[docKey];
    if (Date.now() <= record.expiresAt) {
      return record;
    }
  }

  // 3. Check Firestore if credentials exist
  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      const snap = await db.collection("pending_verifications").doc(docKey).get();
      if (snap.exists) {
        return snap.data() as PendingVerificationRecord;
      }
    } catch {}
  }

  return null;
}

/**
 * Refresh an existing pending verification with a new OTP
 */
export async function refreshPendingOtp(
  email: string,
  newOtp: string,
  token?: string | null
): Promise<{
  success: boolean;
  verificationToken?: string;
  resendAfter?: number;
  expiresAt?: number;
  error?: string;
}> {
  const existing = await getPendingVerification(email, token);
  if (!existing || existing.used) {
    return { success: false, error: "No active verification found. Please sign up again." };
  }

  const now = Date.now();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHashed = hashOtp(newOtp, salt);

  existing.otpHashed = otpHashed;
  existing.salt = salt;
  existing.attempts = 0;
  existing.resendAfter = now + 60 * 1000;
  existing.expiresAt = now + 5 * 60 * 1000;

  const docKey = getEmailDocKey(email);
  memoryStore.set(docKey, existing);

  const disk = readDiskCache();
  disk[docKey] = existing;
  writeDiskCache(disk);

  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).set(existing);
    } catch {}
  }

  const verificationToken = sealVerificationToken(existing);

  return {
    success: true,
    verificationToken,
    resendAfter: existing.resendAfter,
    expiresAt: existing.expiresAt,
  };
}

/**
 * Increment failed attempt counter
 */
export async function incrementFailedAttempt(
  record: PendingVerificationRecord
): Promise<{ remainingAttempts: number; isLocked: boolean; updatedToken: string }> {
  record.attempts += 1;
  const isLocked = record.attempts >= 5;
  const remainingAttempts = Math.max(0, 5 - record.attempts);

  const docKey = getEmailDocKey(record.email);
  memoryStore.set(docKey, record);

  const disk = readDiskCache();
  disk[docKey] = record;
  writeDiskCache(disk);

  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).update({
        attempts: record.attempts,
      });
    } catch {}
  }

  const updatedToken = sealVerificationToken(record);
  return { remainingAttempts, isLocked, updatedToken };
}

/**
 * Mark a record as used
 */
export async function markVerificationUsed(
  record: PendingVerificationRecord
): Promise<void> {
  record.used = true;
  const docKey = getEmailDocKey(record.email);

  memoryStore.delete(docKey);

  const disk = readDiskCache();
  delete disk[docKey];
  writeDiskCache(disk);

  const { db, hasCredentials } = getFirebaseAdmin();
  if (hasCredentials && db) {
    try {
      await db.collection("pending_verifications").doc(docKey).delete();
    } catch {}
  }
}
