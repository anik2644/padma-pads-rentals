import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { getFirebaseDb } from "./firebase";
import type { ConnectedCredential, MockUser } from "@/store/authStore";
import { firebaseUserToStoreUser } from "./firebase-auth";

const USERS = "users";

// ── Firestore schema types ───────────────────────────────────────────────────

export interface FirestoreUser {
  firebaseUid: string;
  displayName: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  role: "user" | "admin";
  status: "active" | "inactive" | "blocked";
  profileCompleted: boolean;
  attachedEmails: Array<{
    email: string;
    loginEnabled: boolean;
    verified: boolean;
    status: "active" | "inactive" | "blocked";
    provider: "self" | "google" | "facebook" | "apple" | "attached";
    previous_uid?: string | null;
    audit: {
      attachedAt: Timestamp;
      verifiedAt: Timestamp | null;
      lastUsedAt: Timestamp | null;
    };
  }>;
  attachedPhoneNumbers: Array<{
    phoneNumber: string;
    loginEnabled: boolean;
    verified: boolean;
    status: "active" | "inactive" | "blocked";
    provider: "attached";
    audit: {
      attachedAt: Timestamp;
      verifiedAt: Timestamp | null;
      lastUsedAt: Timestamp | null;
    };
  }>;
  audit: {
    createdAt: Timestamp;
    createdBy: "self" | "google" | "facebook" | "apple";
    updatedAt: Timestamp | null;
    updatedBy: string | null;
    lastLoginAt: Timestamp;
    deletedAt: Timestamp | null;
    deletedBy: string | null;
  };
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}

function tsToISO(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== "function") return new Date().toISOString();
  return ts.toDate().toISOString();
}

export function firestoreToMockUser(fsUser: FirestoreUser, hasPassword: boolean): MockUser {
  const primaryEmail = fsUser.attachedEmails[0]?.email ?? null;
  const name =
    fsUser.displayName ||
    (fsUser.firstName
      ? [fsUser.firstName, fsUser.lastName].filter(Boolean).join(" ")
      : null) ||
    primaryEmail?.split("@")[0] ||
    "HomeBee Member";

  const emailCredentials: ConnectedCredential[] = fsUser.attachedEmails.map((e, i) => ({
    provider: (
      e.provider === "self" || e.provider === "attached" ? "email" : e.provider
    ) as ConnectedCredential["provider"],
    value: e.email,
    verified: e.verified,
    loginEnabled: e.loginEnabled,
    primary: i === 0,
    addedAt: tsToISO(e.audit.attachedAt),
  }));

  const phoneCredentials: ConnectedCredential[] = fsUser.attachedPhoneNumbers.map((p) => ({
    provider: "phone" as const,
    value: p.phoneNumber,
    verified: p.verified,
    loginEnabled: p.loginEnabled,
    primary: false,
    addedAt: tsToISO(p.audit.attachedAt),
  }));

  const yearNum =
    typeof fsUser.audit?.createdAt?.toDate === "function"
      ? fsUser.audit.createdAt.toDate().getFullYear()
      : new Date().getFullYear();

  return {
    id: fsUser.firebaseUid,
    name,
    email: primaryEmail,
    phone: fsUser.attachedPhoneNumbers[0]?.phoneNumber ?? null,
    avatarInitials: initialsFrom(name),
    avatarUrl: fsUser.photoUrl,
    city: "Dhaka",
    joinedYear: String(yearNum),
    verified: fsUser.attachedEmails[0]?.verified ?? false,
    hasPassword,
    credentials: [...emailCredentials, ...phoneCredentials],
  };
}

// ── Firestore reads ──────────────────────────────────────────────────────────

export async function fetchUserDoc(uid: string): Promise<FirestoreUser | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}

// ── Firestore writes ─────────────────────────────────────────────────────────

export async function createEmailPasswordUserDoc(firebaseUser: User): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !firebaseUser.email) return;
  // serverTimestamp() cannot be used inside array values — use Timestamp.now() there
  const nowTs = Timestamp.now();
  const nowSrv = serverTimestamp();
  await setDoc(doc(db, USERS, firebaseUser.uid), {
    firebaseUid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    firstName: null,
    middleName: null,
    lastName: null,
    photoUrl: firebaseUser.photoURL,
    role: "user",
    status: "active",
    profileCompleted: false,
    attachedEmails: [
      {
        email: firebaseUser.email,
        loginEnabled: true,
        verified: firebaseUser.emailVerified,
        status: "active",
        provider: "self",
        previous_uid: null,
        audit: {
          attachedAt: nowTs,
          verifiedAt: firebaseUser.emailVerified ? nowTs : null,
          lastUsedAt: nowTs,
        },
      },
    ],
    attachedPhoneNumbers: [],
    audit: {
      createdAt: nowSrv,
      createdBy: "self",
      updatedAt: null,
      updatedBy: null,
      lastLoginAt: nowSrv,
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function getOrCreateSocialUserDoc(
  firebaseUser: User,
  provider: "google" | "facebook" | "apple",
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const ref = doc(db, USERS, firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { "audit.lastLoginAt": serverTimestamp() });
    return;
  }
  const nowTs = Timestamp.now();
  const nowSrv = serverTimestamp();
  const displayName = firebaseUser.displayName;
  let firstName: string | null = null;
  let lastName: string | null = null;
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    firstName = parts[0] || null;
    lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }
  await setDoc(ref, {
    firebaseUid: firebaseUser.uid,
    displayName,
    firstName,
    middleName: null,
    lastName,
    photoUrl: firebaseUser.photoURL,
    role: "user",
    status: "active",
    profileCompleted: false,
    attachedEmails: firebaseUser.email
      ? [
          {
            email: firebaseUser.email,
            loginEnabled: true,
            verified: true,
            status: "active",
            provider,
            audit: { attachedAt: nowTs, verifiedAt: nowTs, lastUsedAt: nowTs },
          },
        ]
      : [],
    attachedPhoneNumbers: [],
    audit: {
      createdAt: nowSrv,
      createdBy: provider,
      updatedAt: null,
      updatedBy: null,
      lastLoginAt: nowSrv,
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function updateLastLogin(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS, uid), {
      "audit.lastLoginAt": serverTimestamp(),
    });
  } catch {
    // doc may not exist yet for legacy accounts
  }
}

// ── Resolve for store (primary entry point) ──────────────────────────────────

export async function resolveStoreUser(
  firebaseUser: User,
): Promise<{ user: MockUser; profileCompleted: boolean }> {
  const hasPassword = firebaseUser.providerData.some(
    (p) => p.providerId === "password",
  );

  let fsUser: FirestoreUser | null = null;
  try {
    fsUser = await fetchUserDoc(firebaseUser.uid);
  } catch {
    // network/permissions failure — fall back gracefully
  }

  if (fsUser) {
    try {
      return {
        user: firestoreToMockUser(fsUser, hasPassword),
        profileCompleted: fsUser.profileCompleted,
      };
    } catch (mapErr) {
      console.warn("[resolveStoreUser] firestoreToMockUser failed, using fallback:", mapErr);
    }
  }

  // Fallback: Firestore not configured, doc missing, or mapping error
  const fallback = await firebaseUserToStoreUser(firebaseUser);
  return { user: fallback, profileCompleted: false };
}

// Re-export for convenience
export { updateProfile };
