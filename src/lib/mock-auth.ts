import type { AuthProvider, MockUser } from "@/store/authStore";

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));
let currentDemoOtp: string | null = null;

function generateDemoOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeUser(opts: {
  email?: string;
  phone?: string;
  name?: string;
  provider: AuthProvider;
}): MockUser {
  const fullName =
    opts.name ??
    (opts.email
      ? opts.email.split("@")[0].replace(/[._-]/g, " ")
      : opts.phone
        ? "HomeBee Member"
        : "HomeBee Member");
  const display = fullName.replace(/\b\w/g, (m) => m.toUpperCase());
  const parts = display.split(" ");
  const initials = (parts[0]?.[0] ?? "H") + (parts[1]?.[0] ?? "B");
  return {
    id: `u_${Math.random().toString(36).slice(2, 10)}`,
    name: display,
    email: opts.email ?? null,
    phone: opts.phone ?? null,
    avatarInitials: initials.toUpperCase(),
    city: "Dhaka",
    joinedYear: String(new Date().getFullYear()),
    verified: opts.provider !== "email" && opts.provider !== "phone",
    hasPassword: opts.provider === "email" || opts.provider === "phone",
    credentials: [
      {
        provider: opts.provider,
        value: opts.email ?? opts.phone ?? `${opts.provider}-user`,
        verified: opts.provider !== "email" && opts.provider !== "phone",
        loginEnabled: true,
        primary: true,
        addedAt: new Date().toISOString(),
      },
    ],
  };
}

export const mockAuth = {
  async signupEmail(email: string, _password: string) {
    await delay();
    return makeUser({ email, provider: "email" });
  },
  async signupPhone(phone: string, _password: string) {
    await delay();
    return makeUser({ phone, provider: "phone" });
  },
  async loginEmail(email: string, _password: string) {
    await delay();
    const u = makeUser({ email, provider: "email" });
    u.verified = true;
    u.credentials[0].verified = true;
    return u;
  },
  async loginPhone(phone: string, _password: string) {
    await delay();
    const u = makeUser({ phone, provider: "phone" });
    u.verified = true;
    u.credentials[0].verified = true;
    return u;
  },
  async social(provider: "google" | "facebook" | "apple") {
    await delay(900);
    const sample = {
      google: { email: "you@gmail.com", name: "Google User" },
      facebook: { email: "you@facebook.com", name: "Facebook User" },
      apple: { email: "you@icloud.com", name: "Apple User" },
    }[provider];
    return makeUser({ email: sample.email, name: sample.name, provider });
  },
  async sendOtp() {
    await delay(500);
    currentDemoOtp = generateDemoOtp();
    return { sent: true, code: currentDemoOtp };
  },
  async verifyOtp(code: string) {
    await delay(500);
    return currentDemoOtp !== null && code.trim() === currentDemoOtp;
  },
  async resetPassword(_password: string) {
    await delay();
    return true;
  },
};
