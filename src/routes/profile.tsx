import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  fetchSignInMethodsForEmail,
  reload,
  signOut as firebaseSignOut,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { useEffect, useId, useState } from "react";
import {
  Bell,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Heart,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { VerificationComponent } from "@/components/auth/VerificationComponent";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  appendAttachedEmail,
  appendAttachedPhone,
  findUserDocByEmail,
  findUserDocByPhone,
  normalizeEmail,
  normalizePhone,
  resolveStoreUser,
  updateUserPhotoUrl,
} from "@/lib/firestore-user";
import { uploadProfilePhoto } from "@/lib/file-upload";
import { mockAuth } from "@/lib/mock-auth";
import { countFavorites, FAVORITES_CHANGED_EVENT } from "@/lib/favorites";
import { countMessages } from "@/lib/property-messages";
import { countOwnedResidentialListings } from "@/lib/residential";
import { useAuthStore, type ConnectedCredential } from "@/store/authStore";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — HomeBee" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  if (!user) return <SignedOut />;

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    signOut();
    toast.success(t("profile.loggedOut"));
    navigate({ to: "/auth/login" });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <ProfileHeader />

      <ProfileStats userId={user.id} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ActionCard
          to="/saved"
          icon={Heart}
          label={t("profile.favourites")}
          sub={t("profile.favouritesSub")}
          accent="text-rose-500 bg-rose-500/10"
        />
        <ActionCard
          to="/my-listings"
          icon={Building2}
          label={t("profile.myAddedList")}
          sub={t("profile.myAddedListSub")}
          accent="text-primary bg-primary/10"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Row to="/messages" icon={MessageCircle} label={t("nav.messages")} />
        <Row to="/notifications" icon={Bell} label={t("profile.notifications")} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <SectionHeader title={t("profile.password")} sub={t("profile.passwordSub")} />
          <ChangePassword />
        </section>
      </div>

      <section className="mt-10">
        <SectionHeader title={t("profile.connected")} sub={t("profile.connectedSub")} />
        <AttachmentSettings />
      </section>

      <Separator className="my-6" />
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" /> {t("profile.logout")}
      </Button>
    </div>
  );
}

function ProfileStats({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    saved: 0,
    enquiries: 0,
    listings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      const [saved, sentMessages, receivedMessages, listings] = await Promise.all([
        countFavorites().catch(() => 0),
        countMessages({ senderId: userId }).catch(() => 0),
        countMessages({ receiverId: userId }).catch(() => 0),
        countOwnedResidentialListings(userId).catch(() => 0),
      ]);

      if (!cancelled) {
        setStats({
          saved,
          enquiries: sentMessages + receivedMessages,
          listings,
        });
        setLoading(false);
      }
    }

    loadStats();
    window.addEventListener(FAVORITES_CHANGED_EVENT, loadStats);
    return () => {
      cancelled = true;
      window.removeEventListener(FAVORITES_CHANGED_EVENT, loadStats);
    };
  }, [userId]);

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Stat label={t("profile.saved")} value={loading ? "..." : stats.saved} />
      <Stat label={t("profile.enquiries")} value={loading ? "..." : stats.enquiries} />
      <Stat label={t("profile.listings")} value={stats.listings} />
    </div>
  );
}

function ProfileHeader() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user)!;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-6 md:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 text-xl">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback>{user.avatarInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.verified && (
              <Badge className="gap-1 border-0 bg-secondary/15 text-secondary">
                <Shield className="h-3 w-3" /> {t("profile.verified")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("profile.memberSince", { year: user.joinedYear })}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user.city}
            </span>
          </div>
        </div>
        <EditProfileDialog />
      </div>
    </div>
  );
}

function EditProfileDialog() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user)!;
  const updateUser = useAuthStore((s) => s.updateUser);
  const photoInputId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName(user.name);
    setPhone(user.phone ?? "");
    setCity(user.city);
    setAvatarUrl(user.avatarUrl ?? "");
    setUploading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.chooseImage"));
      return;
    }

    // Show local preview immediately while uploading
    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setUploading(true);

    try {
      const uploadedUrl = await uploadProfilePhoto(file);
      setAvatarUrl(uploadedUrl);
    } catch (err) {
      console.error("[profile] photo upload failed:", err);
      toast.error(t("profile.photoUploadFailed"));
      setAvatarUrl(user.avatarUrl ?? "");
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("profile.nameRequired"));
      return;
    }
    if (uploading) {
      toast.error(t("profile.waitForUpload"));
      return;
    }

    setSaving(true);
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth?.currentUser;

      // Update Firebase Auth profile (displayName + photoURL)
      if (firebaseUser) {
        await updateProfile(firebaseUser, {
          displayName: name.trim(),
          photoURL: avatarUrl || null,
        });
      }

      // Persist photoUrl to Firestore (non-blocking on error)
      updateUserPhotoUrl(user.id, avatarUrl || null).catch(() => {});

      // Update local store
      updateUser({
        name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || "Dhaka",
        avatarInitials: initialsFrom(name),
        avatarUrl: avatarUrl || null,
      });

      toast.success(t("profile.updated"));
      setOpen(false);
    } catch (err) {
      console.error("[profile] save failed:", err);
      toast.error(t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" /> {t("profile.editProfile")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          {/* Photo picker */}
          <div className="flex flex-col items-center gap-2">
            <input
              id={photoInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <label
              htmlFor={photoInputId}
              className={uploading ? "cursor-wait rounded-full" : "cursor-pointer rounded-full"}
            >
              <div className="relative">
                <Avatar className="h-24 w-24 text-2xl ring-2 ring-border transition hover:ring-primary">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                  <AvatarFallback>{initialsFrom(name)}</AvatarFallback>
                </Avatar>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
            </label>
            <p className="text-xs text-muted-foreground">
              {uploading ? t("profile.uploading") : t("profile.clickToChange")}
            </p>
            {avatarUrl && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setAvatarUrl("")}
              >
                {t("profile.removePhoto")}
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">{t("profile.fullName")}</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">{t("profile.email")}</Label>
            <Input id="profile-email" value={user.email ?? ""} disabled />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">{t("profile.phone")}</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-city">{t("profile.city")}</Label>
              <Input id="profile-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={uploading || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("actions.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePassword() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user)!;
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"choose" | "verify" | "form">("choose");
  const [method, setMethod] = useState<"email" | "phone">(user.email ? "email" : "phone");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setStage("choose");
    setPw("");
    setPw2("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error(t("profile.passwordMin"));
    if (pw !== pw2) return toast.error(t("profile.passwordMismatch"));
    setSaving(true);
    try {
      await mockAuth.resetPassword(pw);
      toast.success(t("profile.passwordUpdated"));
      setOpen(false);
      reset();
    } finally {
      setSaving(false);
    }
  }

  const target = method === "email" ? (user.email ?? "") : (user.phone ?? "");

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium">{t("profile.changePassword")}</p>
          <p className="text-xs text-muted-foreground">{t("profile.changePasswordSub")}</p>
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            {t("profile.change")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.changePassword")}</DialogTitle>
          </DialogHeader>

          {stage === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("profile.chooseVerification")}</p>
              <div className="grid gap-2">
                {user.email && (
                  <Button
                    variant="outline"
                    className="h-11 justify-start gap-2"
                    onClick={() => {
                      setMethod("email");
                      setStage("verify");
                    }}
                  >
                    <Mail className="h-4 w-4" /> {t("profile.sendCodeTo", { target: user.email })}
                  </Button>
                )}
                {user.phone && (
                  <Button
                    variant="outline"
                    className="h-11 justify-start gap-2"
                    onClick={() => {
                      setMethod("phone");
                      setStage("verify");
                    }}
                  >
                    <Phone className="h-4 w-4" /> {t("profile.sendCodeTo", { target: user.phone })}
                  </Button>
                )}
              </div>
            </div>
          )}

          {stage === "verify" && (
            <VerificationComponent
              type={method}
              target={target}
              onVerified={() => setStage("form")}
              onCancel={() => setStage("choose")}
            />
          )}

          {stage === "form" && (
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("profile.newPassword")}</Label>
                <Input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("profile.confirmPassword")}</Label>
                <Input
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("profile.updatePassword")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttachmentSettings() {
  const user = useAuthStore((s) => s.user)!;
  const addCredential = useAuthStore((s) => s.addCredential);
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const emails = user.credentials.filter((c) => c.provider === "email");
  const phones = user.credentials.filter((c) => c.provider === "phone");
  const emailBlockMessage =
    emails.length === 1
      ? "No email can be attached here because this account has a single self/attached email credential."
      : null;
  const phoneBlockMessage =
    phones.length > 0
      ? "No phone number can be attached here because this account already has an attached phone number."
      : null;

  async function handleAttach(c: ConnectedCredential) {
    addCredential(c);
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      const [resolved, token] = await Promise.all([
        resolveStoreUser(auth.currentUser),
        auth.currentUser.getIdToken(),
      ]);
      setUser(resolved.user, resolved.profileCompleted);
      setToken(token);
    }
    toast.success(
      c.provider === "email"
        ? "Email attached successfully."
        : "Phone number attached successfully.",
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AttachmentGroup
        icon={<Mail className="h-4 w-4" />}
        title="Attached emails"
        empty="No attached emails yet."
        items={emails}
        addButton={
          <AttachCredential
            type="email"
            blockedMessage={emailBlockMessage}
            onAttach={handleAttach}
          />
        }
      />
      <AttachmentGroup
        icon={<Phone className="h-4 w-4" />}
        title="Attached phone numbers"
        empty="No attached phone numbers yet."
        items={phones}
        addButton={
          <AttachCredential
            type="phone"
            blockedMessage={phoneBlockMessage}
            onAttach={handleAttach}
          />
        }
      />
    </div>
  );
}

function AttachmentGroup({
  icon,
  title,
  empty,
  items,
  addButton,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  items: ConnectedCredential[];
  addButton: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        {addButton}
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{empty}</p>}
        {items.map((item) => (
          <div
            key={`${item.provider}-${item.value}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
          >
            <p className="min-w-0 truncate text-sm font-medium">{item.value}</p>
            {item.verified ? (
              <Badge className="gap-1 border-0 bg-secondary/15 text-secondary">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttachCredential({
  type,
  blockedMessage,
  onAttach,
}: {
  type: "email" | "phone";
  blockedMessage?: string | null;
  onAttach: (c: ConnectedCredential) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [mode, setMode] = useState<"input" | "verify-email" | "verify-phone">("input");
  const [value, setValue] = useState("");
  const [verificationUser, setVerificationUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode("input");
    setValue("");
    setVerificationUser(null);
    setBusy(false);
    setError(null);
  }

  async function startEmailAttachment(e: React.FormEvent) {
    e.preventDefault();
    const email = normalizeEmail(value);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (!auth || !currentUser) throw new Error("You must be logged in.");
      if (await findUserDocByEmail(email))
        throw new Error("This email is already attached to another account.");
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) throw new Error("This email is already registered in Firebase.");
      await verifyBeforeUpdateEmail(currentUser, email);
      setVerificationUser(currentUser);
      setMode("verify-email");
    } catch (err) {
      setError((err as Error).message || "Could not start email attachment.");
    } finally {
      setBusy(false);
    }
  }

  async function completeEmailAttachment(user: User) {
    const email = normalizeEmail(value);
    await appendAttachedEmail(user.uid, email);
    await onAttach({
      provider: "email",
      value: email,
      verified: true,
      loginEnabled: true,
      primary: false,
      addedAt: new Date().toISOString(),
    });
    toast.success("Email attached successfully.");
    setOpen(false);
    reset();
  }

  async function resendAttachmentEmail() {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    await verifyBeforeUpdateEmail(currentUser, normalizeEmail(value));
  }

  async function startPhoneAttachment(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(value);
    if (!/^\+8801\d{9}$/.test(phone)) {
      setError("Enter a valid Bangladeshi phone number, like 01712345678 or +8801712345678.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) throw new Error("You must be logged in.");
      if (await findUserDocByPhone(phone))
        throw new Error("This phone number is already attached.");
      const { code } = await mockAuth.sendOtp();
      toast.info(`Demo OTP sent - use code ${code}`);
      setMode("verify-phone");
    } catch (err) {
      setError((err as Error).message || "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function completePhoneAttachment(code: string) {
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    setBusy(true);
    setError(null);
    try {
      const verified = await mockAuth.verifyOtp(code);
      if (!verified) {
        setError("Invalid OTP. Use the latest demo OTP and try again.");
        return;
      }
      const phone = normalizePhone(value);
      await appendAttachedPhone(currentUser.uid, phone);
      await onAttach({
        provider: "phone",
        value: phone,
        verified: true,
        loginEnabled: true,
        primary: false,
        addedAt: new Date().toISOString(),
      });
      toast.success("Phone number attached successfully.");
      setOpen(false);
      reset();
    } catch (err) {
      setError((err as Error).message || "Invalid OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AlertDialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {type === "email" ? "Email attachment unavailable" : "Phone attachment unavailable"}
            </AlertDialogTitle>
            <AlertDialogDescription>{blockedMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if ((mode === "verify-email" || mode === "verify-phone") && !nextOpen) return;
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (blockedMessage) {
              setBlockedOpen(true);
              return;
            }
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {type === "email" ? "Add email" : "Add phone"}
        </Button>
        <DialogContent
          className={
            mode === "verify-email" || mode === "verify-phone" ? "[&>button]:hidden" : undefined
          }
          onEscapeKeyDown={(e) => {
            if (mode === "verify-email" || mode === "verify-phone") e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (mode === "verify-email" || mode === "verify-phone") e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (mode === "verify-email" || mode === "verify-phone") e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{type === "email" ? "Attach email" : "Attach phone number"}</DialogTitle>
          </DialogHeader>

          {mode === "input" && (
            <form
              onSubmit={type === "email" ? startEmailAttachment : startPhoneAttachment}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label>{type === "email" ? "Email address" : "Phone number"}</Label>
                <Input
                  type={type === "email" ? "email" : "tel"}
                  placeholder={type === "email" ? "you@example.com" : "+8801712345678"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="h-11 w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                <Shield className="h-4 w-4" /> {t("profile.sendVerification")}
              </Button>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}

          {mode === "verify-email" && (
            <EmailAttachmentVerification
              user={verificationUser}
              email={normalizeEmail(value)}
              onVerified={completeEmailAttachment}
              onResend={resendAttachmentEmail}
            />
          )}
          {mode === "verify-phone" && (
            <PhoneAttachmentVerification
              phone={normalizePhone(value)}
              busy={busy}
              error={error}
              onVerified={completePhoneAttachment}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmailAttachmentVerification({
  user,
  email,
  onVerified,
  onResend,
}: {
  user: User | null;
  email: string;
  onVerified: (user: User) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [remaining, setRemaining] = useState(90);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resends, setResends] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let done = false;
    const startedAt = Date.now();

    async function check() {
      if (done) return;
      try {
        await reload(user);
        if (normalizeEmail(user.email ?? "") === email) {
          done = true;
          await onVerified(user);
          return;
        }
        const elapsed = Date.now() - startedAt;
        setRemaining(Math.max(0, Math.ceil((90_000 - elapsed) / 1000)));
        if (elapsed >= 90_000) {
          done = true;
          setExpired(true);
        }
      } catch (err) {
        setError((err as Error).message || "Could not check verification.");
      }
    }

    void check();
    const interval = window.setInterval(check, 3_000);
    return () => {
      done = true;
      window.clearInterval(interval);
    };
  }, [attempt, email, onVerified, user]);

  async function checkAgain() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await reload(user);
      if (normalizeEmail(user.email ?? "") === email) await onVerified(user);
      else setExpired(true);
    } catch (err) {
      setError((err as Error).message || "Could not check verification.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      await onResend();
      setResends((n) => n + 1);
      setExpired(false);
      setRemaining(90);
      setAttempt((n) => n + 1);
    } catch (err) {
      setError((err as Error).message || "Could not resend verification email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-center">
      <div>
        <h3 className="text-lg font-semibold">Verify your new email</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a verification email to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <div className="rounded-md bg-muted px-3 py-2 text-sm">
        {expired ? "Email not verified yet." : `Auto-checking for ${remaining}s`}
      </div>
      {error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={checkAgain} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Check Again
        </Button>
        <Button type="button" variant="outline" onClick={resend} disabled={busy}>
          <RefreshCw className="h-4 w-4" /> Resend Email ({resends})
        </Button>
      </div>
    </div>
  );
}

function PhoneAttachmentVerification({
  phone,
  busy,
  error,
  onVerified,
}: {
  phone: string;
  busy: boolean;
  error: string | null;
  onVerified: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Verify your phone number</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the OTP sent to <span className="font-medium text-foreground">{phone}</span>.
        </p>
      </div>
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) void onVerified(v);
          }}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      <Button
        type="button"
        onClick={() => void onVerified(code)}
        disabled={busy || code.length < 6}
        className="h-11 w-full"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify Phone
      </Button>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function SignedOut() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <LogIn className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">{t("profile.signedOutTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("profile.signedOutSub")}</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link
          to="/auth/login"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("common.login")}
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionCard({
  to,
  icon: Icon,
  label,
  sub,
  accent,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="card-hover flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function Row({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="card-hover flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-medium">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "H"}${parts[1]?.[0] ?? "B"}`.toUpperCase();
}
