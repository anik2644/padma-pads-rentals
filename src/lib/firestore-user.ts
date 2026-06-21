import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentReference,
  type DocumentSnapshot,
} from "firebase/firestore";
import { updateProfile, type User } from "firebase/auth";
import { getFirebaseDb } from "./firebase";
import type { ConnectedCredential, MockUser } from "@/store/authStore";
import { firebaseUserToStoreUser } from "./firebase-auth";

export type EmailProvider = "self" | "google" | "facebook" | "apple" | "attached";
export type SocialEmailProvider = "google" | "facebook" | "apple";

const USERS = "users";

type ProfileUpdater = "self" | SocialEmailProvider | (string & {});
type ProfileField<T> = { value: T | null; updatedBy: ProfileUpdater | null };

export interface AttachedEmail {
  email: string;
  loginEnabled: boolean;
  verified: boolean;
  status: "active" | "inactive" | "blocked";
  provider: EmailProvider;
  previous_uid?: string | null;
  audit: {
    attachedAt: Timestamp;
    verifiedAt: Timestamp | null;
    lastUsedAt: Timestamp | null;
  };
}

export interface AttachedPhoneNumber {
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
}

export interface FirestoreUser {
  firebaseUid: string;
  displayName: ProfileField<string> | string | null;
  firstName: ProfileField<string> | string | null;
  middleName: ProfileField<string> | string | null;
  lastName: ProfileField<string> | string | null;
  photoUrl: ProfileField<string> | string | null;
  role: "user" | "admin";
  status: "active" | "inactive" | "blocked";
  profileCompleted: boolean;
  credentialEmails?: string[];
  credentialPhones?: string[];
  attachedEmails: AttachedEmail[];
  attachedPhoneNumbers: AttachedPhoneNumber[];
  audit: {
    createdAt: Timestamp;
    createdBy: EmailProvider;
    updatedAt: Timestamp | null;
    updatedBy: string | null;
    lastLoginAt: Timestamp;
    deletedAt: Timestamp | null;
    deletedBy: string | null;
  };
}

export interface UserDocMatch {
  ref: DocumentReference;
  snap: DocumentSnapshot;
  data: FirestoreUser;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  if (/^01\d{9}$/.test(compact)) return `+88${compact}`;
  if (/^8801\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

function profileValue<T>(field: ProfileField<T> | T | null | undefined): T | null {
  if (field == null) return null;
  if (typeof field === "object" && "value" in field) return field.value;
  return field as T;
}

function profileField<T>(value: T | null, updatedBy: ProfileUpdater | null): ProfileField<T> {
  return { value, updatedBy: value ? updatedBy : null };
}

function profileFieldCanUpdate(
  existing: ProfileField<string> | string | null | undefined,
  incomingValue: string | null,
  incomingSource: ProfileUpdater,
) {
  if (incomingSource !== "self" && incomingValue == null) return false;
  if (existing && typeof existing === "object" && "updatedBy" in existing) {
    return !(existing.updatedBy === "self" && incomingSource !== "self");
  }
  return true;
}

function appendProfileFieldUpdate(
  update: Record<string, unknown>,
  existing: FirestoreUser,
  key: "displayName" | "firstName" | "middleName" | "lastName" | "photoUrl",
  incomingValue: string | null,
  incomingSource: ProfileUpdater,
) {
  if (!profileFieldCanUpdate(existing[key], incomingValue, incomingSource)) return;
  update[key] = profileField(incomingValue, incomingSource);
}

function splitName(displayName: string | null) {
  if (!displayName) return { firstName: null, middleName: null, lastName: null };
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : null,
    lastName: parts.length > 1 ? parts[parts.length - 1] : null,
  };
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}

function tsToISO(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== "function") return new Date().toISOString();
  return ts.toDate().toISOString();
}

function emailEntry(
  email: string,
  provider: EmailProvider,
  previousUid: string | null = null,
): AttachedEmail {
  const nowTs = Timestamp.now();
  return {
    email: normalizeEmail(email),
    loginEnabled: true,
    verified: true,
    status: "active",
    provider,
    previous_uid: previousUid,
    audit: {
      attachedAt: nowTs,
      verifiedAt: nowTs,
      lastUsedAt: nowTs,
    },
  };
}

function providerToCredentialProvider(provider: EmailProvider): ConnectedCredential["provider"] {
  return provider === "self" || provider === "attached" ? "email" : provider;
}

export function providerLabel(provider: EmailProvider) {
  if (provider === "self") return "email/password";
  if (provider === "attached") return "email";
  return provider[0].toUpperCase() + provider.slice(1);
}

export function firestoreToMockUser(fsUser: FirestoreUser, hasPassword: boolean): MockUser {
  const primaryEmail = fsUser.attachedEmails[0]?.email ?? null;
  const displayName = profileValue(fsUser.displayName);
  const firstName = profileValue(fsUser.firstName);
  const lastName = profileValue(fsUser.lastName);
  const photoUrl = profileValue(fsUser.photoUrl);
  const name =
    displayName ||
    (firstName ? [firstName, lastName].filter(Boolean).join(" ") : null) ||
    primaryEmail?.split("@")[0] ||
    "HomeBee Member";

  const emailCredentials: ConnectedCredential[] = fsUser.attachedEmails.map((e, i) => ({
    provider: providerToCredentialProvider(e.provider),
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
    avatarUrl: photoUrl,
    city: "Dhaka",
    joinedYear: String(yearNum),
    verified: fsUser.attachedEmails[0]?.verified ?? false,
    hasPassword,
    credentials: [...emailCredentials, ...phoneCredentials],
  };
}

function snapToMatch(snap: DocumentSnapshot): UserDocMatch | null {
  if (!snap.exists()) return null;
  return { ref: snap.ref, snap, data: snap.data() as FirestoreUser };
}

export async function fetchUserDoc(uid: string): Promise<FirestoreUser | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}

export async function findUserDocByEmail(email: string): Promise<UserDocMatch | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const normalized = normalizeEmail(email);
  const q = query(
    collection(db, USERS),
    where("credentialEmails", "array-contains", normalized),
    limit(1),
  );
  const direct = await getDocs(q);
  const directMatch = direct.docs[0] ? snapToMatch(direct.docs[0]) : null;
  if (directMatch) return directMatch;

  // Compatibility for documents created before credentialEmails existed.
  const all = await getDocs(collection(db, USERS));
  for (const snap of all.docs) {
    const data = snap.data() as FirestoreUser;
    if (data.attachedEmails?.some((e) => normalizeEmail(e.email) === normalized)) {
      await updateDoc(snap.ref, { credentialEmails: buildCredentialEmails(data) }).catch(() => {});
      return { ref: snap.ref, snap, data };
    }
  }
  return null;
}

export async function findUserDocByPhone(phone: string): Promise<UserDocMatch | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const normalized = normalizePhone(phone);
  const q = query(
    collection(db, USERS),
    where("credentialPhones", "array-contains", normalized),
    limit(1),
  );
  const direct = await getDocs(q);
  const directMatch = direct.docs[0] ? snapToMatch(direct.docs[0]) : null;
  if (directMatch) return directMatch;

  const all = await getDocs(collection(db, USERS));
  for (const snap of all.docs) {
    const data = snap.data() as FirestoreUser;
    if (data.attachedPhoneNumbers?.some((p) => normalizePhone(p.phoneNumber) === normalized)) {
      await updateDoc(snap.ref, { credentialPhones: buildCredentialPhones(data) }).catch(() => {});
      return { ref: snap.ref, snap, data };
    }
  }
  return null;
}

export function findEmailProviders(user: FirestoreUser, email: string) {
  const normalized = normalizeEmail(email);
  return (user.attachedEmails ?? []).filter(
    (e) => normalizeEmail(e.email) === normalized && e.status === "active",
  );
}

export function hasEnabledSelfEmail(user: FirestoreUser, email: string) {
  return findEmailProviders(user, email).some(
    (e) => e.provider === "self" && e.loginEnabled && e.verified && e.status === "active",
  );
}

export function providerEntryExists(user: FirestoreUser, email: string, provider: EmailProvider) {
  return findEmailProviders(user, email).some((e) => e.provider === provider);
}

function buildCredentialEmails(user: Pick<FirestoreUser, "attachedEmails">) {
  return Array.from(
    new Set((user.attachedEmails ?? []).map((e) => normalizeEmail(e.email)).filter(Boolean)),
  );
}

function buildCredentialPhones(user: Pick<FirestoreUser, "attachedPhoneNumbers">) {
  return Array.from(
    new Set(
      (user.attachedPhoneNumbers ?? []).map((p) => normalizePhone(p.phoneNumber)).filter(Boolean),
    ),
  );
}

export async function createEmailPasswordUserDoc(firebaseUser: User): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !firebaseUser.email) return;
  const email = normalizeEmail(firebaseUser.email);
  await setDoc(doc(db, USERS, firebaseUser.uid), {
    firebaseUid: firebaseUser.uid,
    displayName: profileField(firebaseUser.displayName, "self"),
    firstName: profileField(null, null),
    middleName: profileField(null, null),
    lastName: profileField(null, null),
    photoUrl: profileField(firebaseUser.photoURL, "self"),
    role: "user",
    status: "active",
    profileCompleted: false,
    credentialEmails: [email],
    credentialPhones: [],
    attachedEmails: [emailEntry(email, "self")],
    attachedPhoneNumbers: [],
    audit: {
      createdAt: serverTimestamp(),
      createdBy: "self",
      updatedAt: null,
      updatedBy: null,
      lastLoginAt: serverTimestamp(),
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function createSocialUserDoc(
  firebaseUser: User,
  provider: SocialEmailProvider,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !firebaseUser.email) return;
  const email = normalizeEmail(firebaseUser.email);
  const displayName = firebaseUser.displayName ?? null;
  const names = splitName(displayName);
  await setDoc(doc(db, USERS, firebaseUser.uid), {
    firebaseUid: firebaseUser.uid,
    displayName: profileField(displayName, provider),
    firstName: profileField(names.firstName, provider),
    middleName: profileField(names.middleName, provider),
    lastName: profileField(names.lastName, provider),
    photoUrl: profileField(firebaseUser.photoURL, provider),
    role: "user",
    status: "active",
    profileCompleted: false,
    credentialEmails: [email],
    credentialPhones: [],
    attachedEmails: [emailEntry(email, provider)],
    attachedPhoneNumbers: [],
    audit: {
      createdAt: serverTimestamp(),
      createdBy: provider,
      updatedAt: null,
      updatedBy: null,
      lastLoginAt: serverTimestamp(),
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function appendEmailProvider(
  match: UserDocMatch,
  email: string,
  provider: EmailProvider,
  previousUid: string | null = null,
) {
  if (providerEntryExists(match.data, email, provider)) {
    await markEmailProviderUsed(match, email, provider);
    return;
  }
  const attachedEmails = [
    ...(match.data.attachedEmails ?? []),
    emailEntry(email, provider, previousUid),
  ];
  await updateDoc(match.ref, {
    attachedEmails,
    credentialEmails: buildCredentialEmails({ attachedEmails }),
    "audit.lastLoginAt": serverTimestamp(),
  });
}

export async function appendAttachedEmail(uid: string, email: string) {
  const db = getFirebaseDb();
  if (!db) return;
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as FirestoreUser;
  const normalized = normalizeEmail(email);
  const existing = data.attachedEmails ?? [];
  if (existing.some((entry) => normalizeEmail(entry.email) === normalized)) return;
  const attachedEmails = [...existing, emailEntry(normalized, "attached")];
  await updateDoc(ref, {
    attachedEmails,
    credentialEmails: buildCredentialEmails({ attachedEmails }),
  });
}

export async function appendAttachedPhone(uid: string, phoneNumber: string) {
  const db = getFirebaseDb();
  if (!db) return;
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as FirestoreUser;
  const normalized = normalizePhone(phoneNumber);
  const existing = data.attachedPhoneNumbers ?? [];
  if (existing.some((entry) => normalizePhone(entry.phoneNumber) === normalized)) return;
  const nowTs = Timestamp.now();
  const attachedPhoneNumbers = [
    ...existing,
    {
      phoneNumber: normalized,
      loginEnabled: true,
      verified: true,
      status: "active" as const,
      provider: "attached" as const,
      audit: {
        attachedAt: nowTs,
        verifiedAt: nowTs,
        lastUsedAt: nowTs,
      },
    },
  ];
  await updateDoc(ref, {
    attachedPhoneNumbers,
    credentialPhones: buildCredentialPhones({ attachedPhoneNumbers }),
  });
}

export async function markEmailProviderUsed(
  match: UserDocMatch,
  email: string,
  provider: EmailProvider,
) {
  const normalized = normalizeEmail(email);
  const now = Timestamp.now();
  const attachedEmails = (match.data.attachedEmails ?? []).map((entry) =>
    normalizeEmail(entry.email) === normalized && entry.provider === provider
      ? { ...entry, audit: { ...entry.audit, lastUsedAt: now } }
      : entry,
  );
  await updateDoc(match.ref, {
    attachedEmails,
    credentialEmails: buildCredentialEmails({ attachedEmails }),
    "audit.lastLoginAt": serverTimestamp(),
  });
}

export async function markPhoneAndSelfEmailUsed(match: UserDocMatch, phone: string, email: string) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const now = Timestamp.now();
  const attachedPhoneNumbers = (match.data.attachedPhoneNumbers ?? []).map((entry) =>
    normalizePhone(entry.phoneNumber) === normalizedPhone
      ? { ...entry, audit: { ...entry.audit, lastUsedAt: now } }
      : entry,
  );
  const attachedEmails = (match.data.attachedEmails ?? []).map((entry) =>
    normalizeEmail(entry.email) === normalizedEmail && entry.provider === "self"
      ? { ...entry, audit: { ...entry.audit, lastUsedAt: now } }
      : entry,
  );
  await updateDoc(match.ref, {
    attachedPhoneNumbers,
    attachedEmails,
    credentialPhones: buildCredentialPhones({ attachedPhoneNumbers }),
    credentialEmails: buildCredentialEmails({ attachedEmails }),
    "audit.lastLoginAt": serverTimestamp(),
  });
}

export function primarySelfEmailForPhoneLogin(user: FirestoreUser): string | null {
  return (
    user.attachedEmails?.find(
      (e) => e.provider === "self" && e.status === "active" && e.loginEnabled && e.verified,
    )?.email ?? null
  );
}

export function hasEnabledVerifiedPhone(user: FirestoreUser, phone: string) {
  const normalizedPhone = normalizePhone(phone);
  return user.attachedPhoneNumbers?.some(
    (p) =>
      normalizePhone(p.phoneNumber) === normalizedPhone &&
      p.verified &&
      p.loginEnabled &&
      p.status === "active",
  );
}

export async function updateLastLogin(uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, USERS, uid), {
      "audit.lastLoginAt": serverTimestamp(),
    });
  } catch {
    // doc may not exist for legacy accounts
  }
}

export async function syncProviderProfileFields(
  match: UserDocMatch,
  firebaseUser: User,
  provider: ProfileUpdater,
) {
  const displayName = firebaseUser.displayName ?? null;
  const names = splitName(displayName);
  const update: Record<string, unknown> = {};

  appendProfileFieldUpdate(update, match.data, "displayName", displayName, provider);
  appendProfileFieldUpdate(update, match.data, "firstName", names.firstName, provider);
  appendProfileFieldUpdate(update, match.data, "middleName", names.middleName, provider);
  appendProfileFieldUpdate(update, match.data, "lastName", names.lastName, provider);
  appendProfileFieldUpdate(update, match.data, "photoUrl", firebaseUser.photoURL ?? null, provider);

  if (Object.keys(update).length === 0) return;
  await updateDoc(match.ref, {
    ...update,
    "audit.updatedAt": serverTimestamp(),
    "audit.updatedBy": provider,
  });
}

export async function resolveStoreUser(
  firebaseUser: User,
): Promise<{ user: MockUser; profileCompleted: boolean }> {
  let fsUser: FirestoreUser | null = null;
  try {
    fsUser = await fetchUserDoc(firebaseUser.uid);
    if (!fsUser && firebaseUser.email) {
      fsUser = (await findUserDocByEmail(firebaseUser.email))?.data ?? null;
    }
  } catch {
    // network/permissions failure - fall back gracefully
  }

  if (fsUser) {
    try {
      const hasPassword = firebaseUser.providerData.some((p) => p.providerId === "password");
      return {
        user: firestoreToMockUser(fsUser, hasPassword),
        profileCompleted: fsUser.profileCompleted,
      };
    } catch (mapErr) {
      console.warn("[resolveStoreUser] firestoreToMockUser failed, using fallback:", mapErr);
    }
  }

  const fallback = await firebaseUserToStoreUser(firebaseUser);
  return { user: fallback, profileCompleted: false };
}

export { updateProfile, deleteField };
