import type { User } from "firebase/auth";
import type { AuthProvider, MockUser } from "@/store/authStore";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}

function providerFromFirebase(providerId?: string): AuthProvider {
  if (providerId === "google.com") return "google";
  return "email";
}

export async function firebaseUserToStoreUser(user: User): Promise<MockUser> {
  const token = await user.getIdTokenResult();
  const provider = providerFromFirebase(user.providerData[0]?.providerId);
  const name = user.displayName || user.email?.split("@")[0] || "HomeBee Member";
  const value = user.email ?? user.phoneNumber ?? user.uid;

  return {
    id: user.uid,
    name,
    email: user.email,
    phone: user.phoneNumber,
    avatarInitials: initialsFrom(name),
    avatarUrl: user.photoURL,
    city: "Dhaka",
    joinedYear: user.metadata.creationTime
      ? String(new Date(user.metadata.creationTime).getFullYear())
      : String(new Date().getFullYear()),
    verified: user.emailVerified || provider === "google",
    hasPassword: user.providerData.some((p) => p.providerId === "password"),
    credentials: [
      {
        provider,
        value,
        verified: user.emailVerified || provider === "google",
        loginEnabled: true,
        primary: true,
        addedAt: token.authTime ? new Date(token.authTime).toISOString() : new Date().toISOString(),
      },
    ],
  };
}
