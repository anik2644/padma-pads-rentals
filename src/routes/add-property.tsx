import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Hotel,
  Home,
  ImagePlus,
  Loader2,
  LogIn,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  INITIAL_WIZARD_DATA,
  submitResidentialProperty,
  type MediaFile,
  type WizardData,
} from "@/lib/add-property-api";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/add-property")({
  head: () => ({ meta: [{ title: "Add Property — HomeBee" }] }),
  component: AddPropertyPage,
});

// ─── Constants ────────────────────────────────────────────────────────────────

const DIVISIONS = [
  "Dhaka Division",
  "Chattogram Division",
  "Khulna Division",
  "Rajshahi Division",
  "Sylhet Division",
  "Barishal Division",
  "Rangpur Division",
  "Mymensingh Division",
];

const PROPERTY_TYPES = {
  RESIDENTIAL: [
    { value: "HOSTEL_MESS", label: "Hostel / Mess" },
    { value: "SINGLE_ROOM", label: "Single Room" },
    { value: "SHARED_ROOM", label: "Shared Room" },
    { value: "SUBLET", label: "Sublet" },
    { value: "FLAT", label: "Flat" },
    { value: "APARTMENT", label: "Apartment" },
  ],
  COMMERCIAL: [
    { value: "OFFICE_SPACE", label: "Office Space" },
    { value: "SHOP_RETAIL", label: "Shop / Retail" },
    { value: "SHOWROOM", label: "Showroom" },
    { value: "WAREHOUSE_STORAGE", label: "Warehouse / Storage" },
    { value: "RESTAURANT_SPACE", label: "Restaurant Space" },
  ],
  RECREATIONAL: [
    { value: "HOTEL", label: "Hotel" },
    { value: "RESORT", label: "Resort" },
    { value: "GUEST_HOUSE", label: "Guest House" },
    { value: "MOTEL", label: "Motel" },
    { value: "COTTAGE_VILLA", label: "Cottage / Villa" },
  ],
} as const;

const COMM_PREFS = ["Call", "WhatsApp", "In-App Chat", "Email"];
const TARGET_GROUPS = [
  { value: "STUDENT", label: "Student" },
  { value: "BACHELOR", label: "Bachelor" },
  { value: "FAMILY", label: "Family" },
];
const SHARING_TYPES = [
  { value: "TWO_PERSON", label: "2 Person" },
  { value: "THREE_PERSON", label: "3 Person" },
  { value: "FOUR_PERSON", label: "4 Person" },
  { value: "OTHER", label: "Other" },
];
const KITCHEN_ACCESS = [
  { value: "SHARED", label: "Shared" },
  { value: "PRIVATE", label: "Private" },
  { value: "NONE", label: "None" },
];
const GENDER_RESTRICTIONS = [
  { value: "", label: "No restriction" },
  { value: "MALE", label: "Male only" },
  { value: "FEMALE", label: "Female only" },
  { value: "ANY", label: "Any" },
];
const RENT_TYPES = [
  { value: "PER_BED", label: "Per Bed" },
  { value: "PER_ROOM", label: "Per Room" },
];

const STEPS = ["Core Setup", "Details & Media", "Pricing", "Review"];

// ─── Main Component ────────────────────────────────────────────────────────────

function AddPropertyPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LogIn className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Sign in to list a property</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to be signed in to add a property listing.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/auth/login"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return <Wizard />;
}

function Wizard() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  async function handlePublish() {
    setSubmitting(true);
    try {
      if (data.useType === "RESIDENTIAL") {
        await submitResidentialProperty(data);
        toast.success("Property listed successfully! It will appear after approval.");
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        toast.success("Property submitted! (Mock — API coming soon)");
      }
      navigate({ to: "/residential" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveDraft() {
    toast.success("Draft saved locally.");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Add Property</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details to list your property on HomeBee.
        </p>
      </div>

      {/* Progress */}
      <ProgressBar current={page} />

      <div className="mt-8">
        {page === 1 && (
          <Page1
            data={data}
            update={update}
            onNext={() => setPage(2)}
            onSaveDraft={handleSaveDraft}
          />
        )}
        {page === 2 && (
          <Page2
            data={data}
            update={update}
            onBack={() => setPage(1)}
            onNext={() => setPage(3)}
            onSaveDraft={handleSaveDraft}
          />
        )}
        {page === 3 && (
          <Page3
            data={data}
            update={update}
            onBack={() => setPage(2)}
            onNext={() => setPage(4)}
            onSaveDraft={handleSaveDraft}
          />
        )}
        {page === 4 && (
          <Page4
            data={data}
            onBack={() => setPage(3)}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            onEditPage={setPage}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 flex-1 transition-colors",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-foreground">{children}</h2>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NullableBoolField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[
          { v: true, label: "Yes" },
          { v: false, label: "No" },
          { v: null, label: "Unspecified" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v as boolean | null)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              value === opt.v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PageActions({
  onBack,
  onNext,
  onSaveDraft,
  nextLabel = "Continue",
  disabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  nextLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      )}
      <div className="flex-1" />
      {onSaveDraft && (
        <Button type="button" variant="ghost" onClick={onSaveDraft}>
          Save Draft
        </Button>
      )}
      {onNext && (
        <Button type="button" onClick={onNext} className="gap-2" disabled={disabled}>
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ─── PAGE 1: Core Setup ───────────────────────────────────────────────────────

function Page1({
  data,
  update,
  onNext,
  onSaveDraft,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  onNext: () => void;
  onSaveDraft: () => void;
}) {
  function validate() {
    if (!data.useType) return "Please select a use type.";
    if (!data.propertyType) return "Please select a property type.";
    if (!data.propertyName.trim()) return "Property name is required.";
    if (!data.title.trim()) return "Listing title is required.";
    if (!data.description.trim()) return "Description is required.";
    if (!data.division) return "Division is required.";
    if (!data.city.trim()) return "City is required.";
    if (!data.area.trim()) return "Area is required.";
    if (!data.fullAddress.trim()) return "Full address is required.";
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onNext();
  }

  const ptOptions = data.useType
    ? PROPERTY_TYPES[data.useType as keyof typeof PROPERTY_TYPES] ?? []
    : [];

  function toggleTargetGroup(v: string) {
    const tg = data.targetGroup.includes(v)
      ? data.targetGroup.filter((x) => x !== v)
      : [...data.targetGroup, v];
    update({ targetGroup: tg });
  }

  function toggleComm(v: string) {
    const cp = data.commPreferences.includes(v)
      ? data.commPreferences.filter((x) => x !== v)
      : [...data.commPreferences, v];
    update({ commPreferences: cp });
  }

  return (
    <div className="space-y-8">
      {/* Use Type */}
      <section>
        <SectionTitle>Use Type *</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { value: "RESIDENTIAL", label: "Residential", icon: Home, desc: "Rooms, flats, hostels" },
            { value: "COMMERCIAL", label: "Commercial", icon: Building2, desc: "Offices, shops, warehouses" },
            { value: "RECREATIONAL", label: "Recreational", icon: Hotel, desc: "Hotels, resorts, guesthouses" },
          ].map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ useType: value as WizardData["useType"], propertyType: "" })}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                data.useType === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-accent",
              )}
            >
              <Icon className={cn("h-6 w-6", data.useType === value ? "text-primary" : "text-muted-foreground")} />
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Property Type */}
      {data.useType && (
        <section>
          <SectionTitle>Property Type *</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ptOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ propertyType: value })}
                className={cn(
                  "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all text-left",
                  data.propertyType === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/40 hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* Property Identity */}
      <section>
        <SectionTitle>Property Identity</SectionTitle>
        <div className="space-y-4">
          <Field label="Property Name" required>
            <Input
              placeholder="e.g. Green View Hostel"
              value={data.propertyName}
              onChange={(e) => update({ propertyName: e.target.value })}
            />
          </Field>
          <Field label="Listing Title" required>
            <Input
              placeholder="e.g. Comfortable hostel near university"
              value={data.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              placeholder="Describe the property, amenities, surroundings..."
              rows={4}
              value={data.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <Separator />

      {/* Location */}
      <section>
        <SectionTitle>Location</SectionTitle>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Division" required>
              <Select value={data.division} onValueChange={(v) => update({ division: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="City" required>
              <Input
                placeholder="e.g. Dhaka"
                value={data.city}
                onChange={(e) => update({ city: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Area" required>
            <Input
              placeholder="e.g. Mirpur"
              value={data.area}
              onChange={(e) => update({ area: e.target.value })}
            />
          </Field>
          <Field label="Full Address" required>
            <Textarea
              placeholder="House 12, Road 5, Mirpur, Dhaka"
              rows={2}
              value={data.fullAddress}
              onChange={(e) => update({ fullAddress: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="GPS Latitude" hint="Default: Dhaka">
              <Input
                type="number"
                step="0.0001"
                value={data.latitude}
                onChange={(e) => update({ latitude: e.target.value })}
              />
            </Field>
            <Field label="GPS Longitude" hint="Default: Dhaka">
              <Input
                type="number"
                step="0.0001"
                value={data.longitude}
                onChange={(e) => update({ longitude: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Nearby Landmark">
            <Input
              placeholder="e.g. Near Mirpur 10 Metro"
              value={data.nearbyLandmark}
              onChange={(e) => update({ nearbyLandmark: e.target.value })}
            />
          </Field>
        </div>
      </section>

      <Separator />

      {/* Contact Information */}
      <section>
        <SectionTitle>Contact Information</SectionTitle>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Person / Group Name">
              <Input
                placeholder="e.g. Ahmed Properties"
                value={data.contactPerson}
                onChange={(e) => update({ contactPerson: e.target.value })}
              />
            </Field>
            <Field label="Mobile Number">
              <Input
                type="tel"
                placeholder="+8801712345678"
                value={data.mobile}
                onChange={(e) => update({ mobile: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp Number">
              <Input
                type="tel"
                placeholder="+8801712345678"
                value={data.whatsapp}
                onChange={(e) => update({ whatsapp: e.target.value })}
              />
            </Field>
            <Field label="Email Address">
              <Input
                type="email"
                placeholder="contact@example.com"
                value={data.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Communication Preference */}
      <section>
        <SectionTitle>Communication Preference</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {COMM_PREFS.map((pref) => {
            const checked = data.commPreferences.includes(pref);
            return (
              <button
                key={pref}
                type="button"
                onClick={() => toggleComm(pref)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {checked && <Check className="mr-1 inline h-3 w-3" />}
                {pref}
              </button>
            );
          })}
        </div>
      </section>

      {/* Target Group */}
      <section>
        <SectionTitle>Target Group</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {TARGET_GROUPS.map(({ value, label }) => {
            const checked = data.targetGroup.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleTargetGroup(value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {checked && <Check className="mr-1 inline h-3 w-3" />}
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <PageActions onNext={handleNext} onSaveDraft={onSaveDraft} />
    </div>
  );
}

// ─── PAGE 2: Property Details + Rules + Media ──────────────────────────────────

function Page2({
  data,
  update,
  onBack,
  onNext,
  onSaveDraft,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
}) {
  function validate() {
    if (!data.coverImageFile) return "Cover image is required.";
    if (data.useType === "RESIDENTIAL") {
      const pt = data.propertyType;
      if (pt === "HOSTEL_MESS") {
        if (!data.totalSeats) return "Total seats is required.";
        if (!data.availableSeats) return "Available seats is required.";
      } else if (pt === "SHARED_ROOM") {
        if (!data.totalBeds) return "Total beds is required.";
        if (!data.availableBeds) return "Available beds is required.";
      } else if (pt === "FLAT" || pt === "APARTMENT") {
        if (!data.bedrooms) return "Bedrooms is required.";
        if (!data.bathrooms) return "Bathrooms is required.";
      }
    }
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Property Details */}
      <section>
        <SectionTitle>Property Details</SectionTitle>
        <PropertySpecsForm data={data} update={update} />
      </section>

      <Separator />

      {/* Rules */}
      <section>
        <SectionTitle>Rules</SectionTitle>
        <RulesForm data={data} update={update} />
      </section>

      <Separator />

      {/* Media Upload */}
      <section>
        <SectionTitle>Media Upload</SectionTitle>
        <MediaUploadForm data={data} update={update} />
      </section>

      <PageActions onBack={onBack} onNext={handleNext} onSaveDraft={onSaveDraft} />
    </div>
  );
}

// ─── Dynamic Property Specs Form ──────────────────────────────────────────────

function PropertySpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const pt = data.propertyType;
  const ut = data.useType;

  if (ut === "RESIDENTIAL") {
    if (pt === "HOSTEL_MESS") return <HostelSpecsForm data={data} update={update} />;
    if (pt === "SINGLE_ROOM") return <SingleRoomSpecsForm data={data} update={update} />;
    if (pt === "SHARED_ROOM") return <SharedRoomSpecsForm data={data} update={update} />;
    if (pt === "SUBLET") return <SingleRoomSpecsForm data={data} update={update} />;
    if (pt === "FLAT" || pt === "APARTMENT") return <FlatSpecsForm data={data} update={update} />;
  }

  if (ut === "COMMERCIAL") return <CommercialSpecsForm data={data} update={update} />;
  if (ut === "RECREATIONAL") return <RecreationalSpecsForm data={data} update={update} />;

  return null;
}

function HostelSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Total Seats" required>
          <Input
            type="number"
            min={1}
            value={data.totalSeats}
            onChange={(e) => update({ totalSeats: e.target.value })}
          />
        </Field>
        <Field label="Available Seats" required>
          <Input
            type="number"
            min={0}
            value={data.availableSeats}
            onChange={(e) => update({ availableSeats: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Sharing Type" required>
        <Select value={data.sharingType} onValueChange={(v) => update({ sharingType: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHARING_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Bed Provided" checked={data.bedProvided} onChange={(v) => update({ bedProvided: v })} />
        <SwitchField label="Table & Chair" checked={data.tableChairProvided} onChange={(v) => update({ tableChairProvided: v })} />
        <SwitchField label="Attached Bathroom" checked={data.attachedBathroom} onChange={(v) => update({ attachedBathroom: v })} />
        <SwitchField label="Food Included" checked={data.foodIncluded} onChange={(v) => update({ foodIncluded: v })} />
        <SwitchField label="Wi-Fi Available" checked={data.wifiAvailable} onChange={(v) => update({ wifiAvailable: v })} />
      </div>
    </div>
  );
}

function SingleRoomSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Room Size (sq ft)" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 140"
            value={data.roomSize}
            onChange={(e) => update({ roomSize: e.target.value })}
          />
        </Field>
        <Field label="Floor Number" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 5"
            value={data.floorNumber}
            onChange={(e) => update({ floorNumber: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Kitchen Access" required>
        <Select value={data.kitchenAccess} onValueChange={(v) => update({ kitchenAccess: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KITCHEN_ACCESS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Furnished" checked={data.furnished} onChange={(v) => update({ furnished: v })} />
        <SwitchField label="Attached Bathroom" checked={data.attachedBathroom} onChange={(v) => update({ attachedBathroom: v })} />
        <SwitchField label="Balcony" checked={data.balcony} onChange={(v) => update({ balcony: v })} />
      </div>
    </div>
  );
}

function SharedRoomSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Total Beds" required>
          <Input
            type="number"
            min={1}
            value={data.totalBeds}
            onChange={(e) => update({ totalBeds: e.target.value })}
          />
        </Field>
        <Field label="Available Beds" required>
          <Input
            type="number"
            min={0}
            value={data.availableBeds}
            onChange={(e) => update({ availableBeds: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Sharing Type" required>
        <Select value={data.sharingType} onValueChange={(v) => update({ sharingType: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHARING_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Room Size (sq ft)" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 180"
            value={data.roomSize}
            onChange={(e) => update({ roomSize: e.target.value })}
          />
        </Field>
        <Field label="Floor Number" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 3"
            value={data.floorNumber}
            onChange={(e) => update({ floorNumber: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Kitchen Access" required>
        <Select value={data.kitchenAccess} onValueChange={(v) => update({ kitchenAccess: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KITCHEN_ACCESS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Bed Provided" checked={data.sharedBedProvided} onChange={(v) => update({ sharedBedProvided: v })} />
        <SwitchField label="Furnished" checked={data.furnished} onChange={(v) => update({ furnished: v })} />
        <SwitchField label="Attached Bathroom" checked={data.attachedBathroom} onChange={(v) => update({ attachedBathroom: v })} />
        <SwitchField label="Balcony" checked={data.balcony} onChange={(v) => update({ balcony: v })} />
      </div>
    </div>
  );
}

function FlatSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bedrooms" required>
          <Input
            type="number"
            min={0}
            value={data.bedrooms}
            onChange={(e) => update({ bedrooms: e.target.value })}
          />
        </Field>
        <Field label="Bathrooms" required>
          <Input
            type="number"
            min={0}
            value={data.bathrooms}
            onChange={(e) => update({ bathrooms: e.target.value })}
          />
        </Field>
        <Field label="Balconies">
          <Input
            type="number"
            min={0}
            value={data.balconyCount}
            onChange={(e) => update({ balconyCount: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Kitchens">
          <Input
            type="number"
            min={0}
            value={data.kitchen}
            onChange={(e) => update({ kitchen: e.target.value })}
          />
        </Field>
        <Field label="Floor Number" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 6"
            value={data.floorNumber}
            onChange={(e) => update({ floorNumber: e.target.value })}
          />
        </Field>
        <Field label="Square Feet" hint="Optional">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 1250"
            value={data.squareFeet}
            onChange={(e) => update({ squareFeet: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Drawing Room" checked={data.drawingRoom} onChange={(v) => update({ drawingRoom: v })} />
        <SwitchField label="Dining Room" checked={data.dining} onChange={(v) => update({ dining: v })} />
        <SwitchField label="Lift" checked={data.lift} onChange={(v) => update({ lift: v })} />
        <SwitchField label="Parking" checked={data.parking} onChange={(v) => update({ parking: v })} />
      </div>
    </div>
  );
}

function CommercialSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const pt = data.propertyType;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Commercial API coming soon — filling this in will be saved as a draft.
      </div>
      {(pt === "OFFICE_SPACE") && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Floor Area (sq ft)">
              <Input type="number" value={data.floorArea} onChange={(e) => update({ floorArea: e.target.value })} />
            </Field>
            <Field label="Rooms">
              <Input type="number" value={data.commercialRooms} onChange={(e) => update({ commercialRooms: e.target.value })} />
            </Field>
          </div>
          <Field label="Cabins">
            <Input type="number" value={data.cabins} onChange={(e) => update({ cabins: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField label="Reception Area" checked={data.receptionArea} onChange={(v) => update({ receptionArea: v })} />
            <SwitchField label="Furnished" checked={data.furnished} onChange={(v) => update({ furnished: v })} />
            <SwitchField label="AC Available" checked={data.acAvailable} onChange={(v) => update({ acAvailable: v })} />
            <SwitchField label="Lift" checked={data.lift} onChange={(v) => update({ lift: v })} />
            <SwitchField label="Parking" checked={data.parking} onChange={(v) => update({ parking: v })} />
            <SwitchField label="Generator" checked={data.generatorAvailable} onChange={(v) => update({ generatorAvailable: v })} />
            <SwitchField label="Internet Ready" checked={data.internetReady} onChange={(v) => update({ internetReady: v })} />
          </div>
        </>
      )}
      {pt === "SHOP_RETAIL" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop Size (sq ft)">
              <Input type="number" value={data.shopSize} onChange={(e) => update({ shopSize: e.target.value })} />
            </Field>
            <Field label="Front Width (ft)">
              <Input type="number" value={data.frontWidth} onChange={(e) => update({ frontWidth: e.target.value })} />
            </Field>
          </div>
          <Field label="Foot Traffic Level">
            <Input placeholder="e.g. High, Medium, Low" value={data.footTrafficLevel} onChange={(e) => update({ footTrafficLevel: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField label="Glass Front" checked={data.glassFront} onChange={(v) => update({ glassFront: v })} />
            <SwitchField label="Storage Space" checked={data.storageSpace} onChange={(v) => update({ storageSpace: v })} />
          </div>
        </>
      )}
      {pt === "WAREHOUSE_STORAGE" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Total Space (sq ft)">
              <Input type="number" value={data.floorArea} onChange={(e) => update({ floorArea: e.target.value })} />
            </Field>
            <Field label="Ceiling Height (ft)">
              <Input type="number" value={data.ceilingHeight} onChange={(e) => update({ ceilingHeight: e.target.value })} />
            </Field>
          </div>
          <Field label="Electricity Type">
            <Input placeholder="e.g. 3-phase, Single-phase" value={data.electricityType} onChange={(e) => update({ electricityType: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField label="Loading Facility" checked={data.loadingFacility} onChange={(v) => update({ loadingFacility: v })} />
            <SwitchField label="Truck Access" checked={data.truckAccess} onChange={(v) => update({ truckAccess: v })} />
            <SwitchField label="Security" checked={data.security} onChange={(v) => update({ security: v })} />
          </div>
        </>
      )}
      {pt === "RESTAURANT_SPACE" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Seating Capacity">
              <Input type="number" value={data.seatingCapacity} onChange={(e) => update({ seatingCapacity: e.target.value })} />
            </Field>
            <Field label="Visibility Type">
              <Input placeholder="e.g. Corner, Street-facing" value={data.visibilityType} onChange={(e) => update({ visibilityType: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchField label="Kitchen Space" checked={data.kitchenSpace} onChange={(v) => update({ kitchenSpace: v })} />
            <SwitchField label="Gas Line" checked={data.gasLine} onChange={(v) => update({ gasLine: v })} />
            <SwitchField label="Exhaust System" checked={data.exhaustSystem} onChange={(v) => update({ exhaustSystem: v })} />
          </div>
        </>
      )}
    </div>
  );
}

function RecreationalSpecsForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Recreational API coming soon — filling this in will be saved as a draft.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Star Rating">
          <Select value={data.starRating} onValueChange={(v) => update({ starRating: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {["1", "2", "3", "4", "5"].map((r) => (
                <SelectItem key={r} value={r}>{r} Star{r !== "1" ? "s" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Total Rooms">
          <Input type="number" value={data.totalRooms} onChange={(e) => update({ totalRooms: e.target.value })} />
        </Field>
      </div>
      <p className="text-sm font-medium text-foreground">Facilities</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Pool" checked={data.hasPool} onChange={(v) => update({ hasPool: v })} />
        <SwitchField label="Gym" checked={data.hasGym} onChange={(v) => update({ hasGym: v })} />
        <SwitchField label="Restaurant" checked={data.hasRestaurant} onChange={(v) => update({ hasRestaurant: v })} />
        <SwitchField label="Conference Hall" checked={data.hasConferenceHall} onChange={(v) => update({ hasConferenceHall: v })} />
        <SwitchField label="Playground" checked={data.hasPlayground} onChange={(v) => update({ hasPlayground: v })} />
        <SwitchField label="BBQ Area" checked={data.hasBBQArea} onChange={(v) => update({ hasBBQArea: v })} />
        <SwitchField label="Garden" checked={data.hasGarden} onChange={(v) => update({ hasGarden: v })} />
        <SwitchField label="Scenic View" checked={data.hasScenic} onChange={(v) => update({ hasScenic: v })} />
      </div>
      <p className="text-sm font-medium text-foreground">Services</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchField label="Airport Pickup" checked={data.hasAirportPickup} onChange={(v) => update({ hasAirportPickup: v })} />
        <SwitchField label="Room Service" checked={data.hasRoomService} onChange={(v) => update({ hasRoomService: v })} />
        <SwitchField label="Laundry" checked={data.hasLaundry} onChange={(v) => update({ hasLaundry: v })} />
        <SwitchField label="Tour Assistance" checked={data.hasTourAssistance} onChange={(v) => update({ hasTourAssistance: v })} />
        <SwitchField label="Car Rental" checked={data.hasCarRental} onChange={(v) => update({ hasCarRental: v })} />
      </div>
    </div>
  );
}

// ─── Rules Form ───────────────────────────────────────────────────────────────

function RulesForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const ut = data.useType;

  if (ut === "RESIDENTIAL" || ut === "RECREATIONAL") {
    return (
      <div className="space-y-4">
        <NullableBoolField
          label="Pets Allowed"
          value={data.petsAllowed}
          onChange={(v) => update({ petsAllowed: v })}
        />
        <NullableBoolField
          label="Smoking Allowed"
          value={data.smokingAllowed}
          onChange={(v) => update({ smokingAllowed: v })}
        />
        {ut === "RESIDENTIAL" && (
          <Field label="Gender Restriction">
            <Select
              value={data.genderRestriction}
              onValueChange={(v) => update({ genderRestriction: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No restriction" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_RESTRICTIONS.map(({ value, label }) => (
                  <SelectItem key={value || "_none"} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        {ut === "RECREATIONAL" && (
          <>
            <NullableBoolField
              label="Outside Food Allowed"
              value={data.outsideFoodAllowed}
              onChange={(v) => update({ outsideFoodAllowed: v })}
            />
            <Field label="Cancellation Policy">
              <Textarea
                rows={2}
                placeholder="e.g. Free cancellation up to 24 hours before check-in"
                value={data.cancellationPolicy}
                onChange={(e) => update({ cancellationPolicy: e.target.value })}
              />
            </Field>
            <Field label="Refund Policy">
              <Textarea
                rows={2}
                placeholder="e.g. 100% refund if cancelled 48 hours in advance"
                value={data.refundPolicy}
                onChange={(e) => update({ refundPolicy: e.target.value })}
              />
            </Field>
          </>
        )}
      </div>
    );
  }

  if (ut === "COMMERCIAL") {
    return (
      <div className="space-y-4">
        <SwitchField label="24/7 Access" checked={data.security} onChange={(v) => update({ security: v })} hint="Tenants can access round the clock" />
        <SwitchField label="Renovation Allowed" checked={data.glassFront} onChange={(v) => update({ glassFront: v })} hint="Tenants can renovate the space" />
        <SwitchField label="Noise Restriction" checked={data.loadingFacility} onChange={(v) => update({ loadingFacility: v })} hint="Noise restrictions apply" />
        <Field label="Business Types Allowed">
          <Input
            placeholder="e.g. IT, Retail, Healthcare"
            value={data.footTrafficLevel}
            onChange={(e) => update({ footTrafficLevel: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  return null;
}

// ─── Media Upload Form ────────────────────────────────────────────────────────

function MediaUploadForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const coverRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);
  const videosRef = useRef<HTMLInputElement>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const preview = URL.createObjectURL(file);
    update({ coverImageFile: file, coverImagePreview: preview });
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    const newPhotos: MediaFile[] = imgs.map((f) => ({
      file: f,
      caption: "",
      preview: URL.createObjectURL(f),
    }));
    update({ photoFiles: [...data.photoFiles, ...newPhotos] });
    e.target.value = "";
  }

  function handleVideosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const vids = files.filter((f) => f.type.startsWith("video/"));
    const newVideos: MediaFile[] = vids.map((f) => ({
      file: f,
      caption: "",
      preview: URL.createObjectURL(f),
    }));
    update({ videoFiles: [...data.videoFiles, ...newVideos] });
    e.target.value = "";
  }

  function removePhoto(i: number) {
    const updated = data.photoFiles.filter((_, idx) => idx !== i);
    update({ photoFiles: updated });
  }

  function removeVideo(i: number) {
    const updated = data.videoFiles.filter((_, idx) => idx !== i);
    update({ videoFiles: updated });
  }

  function updatePhotoCaption(i: number, caption: string) {
    const updated = data.photoFiles.map((p, idx) => (idx === i ? { ...p, caption } : p));
    update({ photoFiles: updated });
  }

  function updateVideoCaption(i: number, caption: string) {
    const updated = data.videoFiles.map((v, idx) => (idx === i ? { ...v, caption } : v));
    update({ videoFiles: updated });
  }

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <div>
        <Label className="mb-2 block">
          Cover Image <span className="text-destructive">*</span>
        </Label>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
        {data.coverImagePreview ? (
          <div className="relative">
            <img
              src={data.coverImagePreview}
              alt="Cover"
              className="h-48 w-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                update({ coverImageFile: null, coverImagePreview: "" });
                if (coverRef.current) coverRef.current.value = "";
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-destructive hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mt-2">
              <Input
                placeholder="Caption (optional)"
                value={data.coverImageCaption}
                onChange={(e) => update({ coverImageCaption: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
          >
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm font-medium">Click to upload cover image</span>
            <span className="text-xs">PNG, JPG, WEBP accepted</span>
          </button>
        )}
      </div>

      {/* Photo Gallery */}
      <div>
        <Label className="mb-2 block">Photo Gallery</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.photoFiles.map((p, i) => (
            <div key={i} className="space-y-1.5">
              <div className="relative">
                <img
                  src={p.preview}
                  alt={`Photo ${i + 1}`}
                  className="h-28 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <Input
                className="h-7 text-xs"
                placeholder="Caption"
                value={p.caption}
                onChange={(e) => updatePhotoCaption(i, e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => photosRef.current?.click()}
            className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Add photos</span>
          </button>
        </div>
        <input
          ref={photosRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotosChange}
        />
      </div>

      {/* Video Upload */}
      <div>
        <Label className="mb-2 block">Videos (Optional)</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.videoFiles.map((v, i) => (
            <div key={i} className="space-y-1.5">
              <div className="relative">
                <div className="flex h-28 items-center justify-center rounded-xl bg-muted">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="absolute bottom-1 left-1.5 right-1.5 truncate rounded bg-background/80 px-1 text-[10px]">
                  {v.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => removeVideo(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <Input
                className="h-7 text-xs"
                placeholder="Caption"
                value={v.caption}
                onChange={(e) => updateVideoCaption(i, e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => videosRef.current?.click()}
            className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
          >
            <Video className="h-6 w-6" />
            <span className="text-xs">Add videos</span>
          </button>
        </div>
        <input
          ref={videosRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleVideosChange}
        />
      </div>
    </div>
  );
}

// ─── PAGE 3: Pricing ──────────────────────────────────────────────────────────

function Page3({
  data,
  update,
  onBack,
  onNext,
  onSaveDraft,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
}) {
  function validate() {
    const ut = data.useType;
    const pt = data.propertyType;
    if (ut === "RESIDENTIAL") {
      if (pt === "HOSTEL_MESS" && !data.rentPerSeat) return "Rent per seat is required.";
      if (pt !== "HOSTEL_MESS" && ut === "RESIDENTIAL" && !data.monthlyRent)
        return "Monthly rent is required.";
    }
    if (ut === "RECREATIONAL" && !data.pricePerNight) return "Price per night is required.";
    if (ut === "COMMERCIAL" && !data.monthlyRent) return "Monthly rent is required.";
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Pricing / Rental Details</SectionTitle>
        <RentalForm data={data} update={update} />
      </section>

      <PageActions onBack={onBack} onNext={handleNext} onSaveDraft={onSaveDraft} />
    </div>
  );
}

function RentalForm({
  data,
  update,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
}) {
  const ut = data.useType;
  const pt = data.propertyType;

  if (ut === "RECREATIONAL") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Recreational API coming soon — pricing will be saved as a draft.
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price Per Night (৳)" required>
            <Input type="number" min={0} value={data.pricePerNight} onChange={(e) => update({ pricePerNight: e.target.value })} />
          </Field>
          <Field label="Weekend Price (৳)">
            <Input type="number" min={0} value={data.weekendPrice} onChange={(e) => update({ weekendPrice: e.target.value })} />
          </Field>
          <Field label="Holiday Price (৳)">
            <Input type="number" min={0} value={data.holidayPrice} onChange={(e) => update({ holidayPrice: e.target.value })} />
          </Field>
          <Field label="Extra Bed Cost (৳)">
            <Input type="number" min={0} value={data.extraBedCost} onChange={(e) => update({ extraBedCost: e.target.value })} />
          </Field>
          <Field label="Minimum Stay (nights)">
            <Input type="number" min={1} value={data.minimumStay} onChange={(e) => update({ minimumStay: e.target.value })} />
          </Field>
          <Field label="Service Charge (৳)">
            <Input type="number" min={0} value={data.recServiceCharge} onChange={(e) => update({ recServiceCharge: e.target.value })} />
          </Field>
        </div>
        <SwitchField label="Tax Included" checked={data.taxIncluded} onChange={(v) => update({ taxIncluded: v })} />
        <CommonRentalFields data={data} update={update} showNegotiable={false} />
      </div>
    );
  }

  if (ut === "COMMERCIAL") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Commercial API coming soon — pricing will be saved as a draft.
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly Rent (৳)" required>
            <Input type="number" min={0} value={data.monthlyRent} onChange={(e) => update({ monthlyRent: e.target.value })} />
          </Field>
          <Field label="Advance (৳)">
            <Input type="number" min={0} value={data.advance} onChange={(e) => update({ advance: e.target.value })} />
          </Field>
          <Field label="Service Charge (৳)">
            <Input type="number" min={0} value={data.serviceCharge} onChange={(e) => update({ serviceCharge: e.target.value })} />
          </Field>
          <Field label="Min. Contract Duration">
            <Input placeholder="e.g. 12 months" value={data.minimumContractDuration} onChange={(e) => update({ minimumContractDuration: e.target.value })} />
          </Field>
        </div>
        <SwitchField label="Utilities Included" checked={data.utilityIncluded} onChange={(v) => update({ utilityIncluded: v })} />
        <CommonRentalFields data={data} update={update} />
      </div>
    );
  }

  // RESIDENTIAL
  if (pt === "HOSTEL_MESS") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rent Per Seat (৳)" required>
            <Input type="number" min={0} value={data.rentPerSeat} onChange={(e) => update({ rentPerSeat: e.target.value })} />
          </Field>
          <Field label="Advance (৳)">
            <Input type="number" min={0} value={data.advance} onChange={(e) => update({ advance: e.target.value })} />
          </Field>
          <Field label="Meal Cost (৳)">
            <Input type="number" min={0} value={data.mealCost} onChange={(e) => update({ mealCost: e.target.value })} />
          </Field>
        </div>
        <CommonRentalFields data={data} update={update} />
      </div>
    );
  }

  if (pt === "SHARED_ROOM") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly Rent (৳)" required>
            <Input type="number" min={0} value={data.monthlyRent} onChange={(e) => update({ monthlyRent: e.target.value })} />
          </Field>
          <Field label="Advance (৳)">
            <Input type="number" min={0} value={data.advance} onChange={(e) => update({ advance: e.target.value })} />
          </Field>
        </div>
        <Field label="Rent Type" required>
          <Select value={data.rentType} onValueChange={(v) => update({ rentType: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RENT_TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <SwitchField label="Utility Included" checked={data.utilityIncluded} onChange={(v) => update({ utilityIncluded: v })} />
        <CommonRentalFields data={data} update={update} />
      </div>
    );
  }

  if (pt === "FLAT" || pt === "APARTMENT") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly Rent (৳)" required>
            <Input type="number" min={0} value={data.monthlyRent} onChange={(e) => update({ monthlyRent: e.target.value })} />
          </Field>
          <Field label="Advance (৳)">
            <Input type="number" min={0} value={data.advance} onChange={(e) => update({ advance: e.target.value })} />
          </Field>
          <Field label="Service Charge (৳)">
            <Input type="number" min={0} value={data.serviceCharge} onChange={(e) => update({ serviceCharge: e.target.value })} />
          </Field>
          <Field label="Utilities (৳)">
            <Input type="number" min={0} value={data.utilities} onChange={(e) => update({ utilities: e.target.value })} />
          </Field>
        </div>
        <CommonRentalFields data={data} update={update} />
      </div>
    );
  }

  // Single Room / Sublet
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monthly Rent (৳)" required>
          <Input type="number" min={0} value={data.monthlyRent} onChange={(e) => update({ monthlyRent: e.target.value })} />
        </Field>
        <Field label="Advance (৳)">
          <Input type="number" min={0} value={data.advance} onChange={(e) => update({ advance: e.target.value })} />
        </Field>
      </div>
      <SwitchField label="Utility Included" checked={data.utilityIncluded} onChange={(v) => update({ utilityIncluded: v })} />
      <CommonRentalFields data={data} update={update} />
    </div>
  );
}

function CommonRentalFields({
  data,
  update,
  showNegotiable = true,
}: {
  data: WizardData;
  update: (p: Partial<WizardData>) => void;
  showNegotiable?: boolean;
}) {
  return (
    <>
      <Field label="Available From">
        <Input type="date" value={data.availableFrom} onChange={(e) => update({ availableFrom: e.target.value })} />
      </Field>
      {showNegotiable && (
        <SwitchField label="Negotiable" checked={data.negotiable} onChange={(v) => update({ negotiable: v })} />
      )}
      <Field label="Remarks">
        <Textarea
          rows={2}
          placeholder="Any additional notes..."
          value={data.remarks}
          onChange={(e) => update({ remarks: e.target.value })}
        />
      </Field>
    </>
  );
}

// ─── PAGE 4: Final Review ─────────────────────────────────────────────────────

function Page4({
  data,
  onBack,
  onPublish,
  onSaveDraft,
  onEditPage,
  submitting,
}: {
  data: WizardData;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  onEditPage: (page: number) => void;
  submitting: boolean;
}) {
  const ptLabel =
    [...Object.values(PROPERTY_TYPES)]
      .flat()
      .find((p) => p.value === data.propertyType)?.label ?? data.propertyType;

  return (
    <div className="space-y-6">
      {data.useType !== "RESIDENTIAL" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <strong>Note:</strong> {data.useType === "COMMERCIAL" ? "Commercial" : "Recreational"} property
          submission is in mock mode. The listing will not be stored in the backend yet.
        </div>
      )}

      <ReviewSection title="Property Summary" onEdit={() => onEditPage(1)}>
        <ReviewRow label="Use Type" value={data.useType} />
        <ReviewRow label="Property Type" value={ptLabel} />
        <ReviewRow label="Property Name" value={data.propertyName} />
        <ReviewRow label="Listing Title" value={data.title} />
        <ReviewRow
          label="Description"
          value={data.description}
          className="whitespace-pre-wrap"
        />
      </ReviewSection>

      <ReviewSection title="Location" onEdit={() => onEditPage(1)}>
        <ReviewRow label="Division" value={data.division} />
        <ReviewRow label="City" value={data.city} />
        <ReviewRow label="Area" value={data.area} />
        <ReviewRow label="Full Address" value={data.fullAddress} />
        <ReviewRow label="GPS" value={`${data.latitude}, ${data.longitude}`} />
        {data.nearbyLandmark && <ReviewRow label="Nearby Landmark" value={data.nearbyLandmark} />}
      </ReviewSection>

      <ReviewSection title="Contact" onEdit={() => onEditPage(1)}>
        {data.contactPerson && <ReviewRow label="Contact Person" value={data.contactPerson} />}
        {data.mobile && <ReviewRow label="Mobile" value={data.mobile} />}
        {data.whatsapp && <ReviewRow label="WhatsApp" value={data.whatsapp} />}
        {data.contactEmail && <ReviewRow label="Email" value={data.contactEmail} />}
        {data.commPreferences.length > 0 && (
          <ReviewRow label="Communication" value={data.commPreferences.join(", ")} />
        )}
        {data.targetGroup.length > 0 && (
          <ReviewRow label="Target Group" value={data.targetGroup.join(", ")} />
        )}
      </ReviewSection>

      <ReviewSection title="Rules" onEdit={() => onEditPage(2)}>
        <ReviewRow
          label="Pets Allowed"
          value={data.petsAllowed === null ? "Not specified" : data.petsAllowed ? "Yes" : "No"}
        />
        <ReviewRow
          label="Smoking Allowed"
          value={data.smokingAllowed === null ? "Not specified" : data.smokingAllowed ? "Yes" : "No"}
        />
        {data.genderRestriction && (
          <ReviewRow
            label="Gender Restriction"
            value={GENDER_RESTRICTIONS.find((g) => g.value === data.genderRestriction)?.label ?? data.genderRestriction}
          />
        )}
      </ReviewSection>

      <ReviewSection title="Media" onEdit={() => onEditPage(2)}>
        <div className="space-y-3">
          {data.coverImagePreview && (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Cover Image</p>
              <img
                src={data.coverImagePreview}
                alt="Cover"
                className="h-32 w-full rounded-xl object-cover sm:w-64"
              />
            </div>
          )}
          {data.photoFiles.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Gallery ({data.photoFiles.length} photo{data.photoFiles.length !== 1 ? "s" : ""})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.photoFiles.map((p, i) => (
                  <img
                    key={i}
                    src={p.preview}
                    alt={`Photo ${i + 1}`}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}
          {data.videoFiles.length > 0 && (
            <ReviewRow
              label="Videos"
              value={`${data.videoFiles.length} video${data.videoFiles.length !== 1 ? "s" : ""}`}
            />
          )}
        </div>
      </ReviewSection>

      <ReviewSection title="Pricing" onEdit={() => onEditPage(3)}>
        <PricingReview data={data} />
      </ReviewSection>

      {/* Validation check */}
      <ValidationSummary data={data} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1" />
        <Button type="button" variant="ghost" onClick={onSaveDraft}>
          Save Draft
        </Button>
        <Button type="button" onClick={onPublish} disabled={submitting} className="gap-2">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
            </>
          ) : (
            "Publish Listing"
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="h-7 text-xs">
          Edit
        </Button>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("flex-1 font-medium", className)}>{String(value)}</span>
    </div>
  );
}

function PricingReview({ data }: { data: WizardData }) {
  const pt = data.propertyType;
  const ut = data.useType;

  if (ut === "RECREATIONAL") {
    return (
      <>
        <ReviewRow label="Price/Night" value={data.pricePerNight ? `৳${data.pricePerNight}` : null} />
        <ReviewRow label="Weekend Price" value={data.weekendPrice ? `৳${data.weekendPrice}` : null} />
        <ReviewRow label="Service Charge" value={data.recServiceCharge ? `৳${data.recServiceCharge}` : null} />
        <ReviewRow label="Tax Included" value={data.taxIncluded ? "Yes" : "No"} />
      </>
    );
  }

  if (pt === "HOSTEL_MESS") {
    return (
      <>
        <ReviewRow label="Rent/Seat" value={data.rentPerSeat ? `৳${data.rentPerSeat}` : null} />
        <ReviewRow label="Advance" value={data.advance ? `৳${data.advance}` : null} />
        <ReviewRow label="Meal Cost" value={data.mealCost ? `৳${data.mealCost}` : null} />
        <ReviewRow label="Available From" value={data.availableFrom} />
        <ReviewRow label="Negotiable" value={data.negotiable ? "Yes" : "No"} />
        {data.remarks && <ReviewRow label="Remarks" value={data.remarks} />}
      </>
    );
  }

  return (
    <>
      <ReviewRow label="Monthly Rent" value={data.monthlyRent ? `৳${data.monthlyRent}` : null} />
      <ReviewRow label="Advance" value={data.advance ? `৳${data.advance}` : null} />
      {data.serviceCharge && <ReviewRow label="Service Charge" value={`৳${data.serviceCharge}`} />}
      {data.utilities && <ReviewRow label="Utilities" value={`৳${data.utilities}`} />}
      <ReviewRow label="Available From" value={data.availableFrom} />
      <ReviewRow label="Negotiable" value={data.negotiable ? "Yes" : "No"} />
      {data.remarks && <ReviewRow label="Remarks" value={data.remarks} />}
    </>
  );
}

function ValidationSummary({ data }: { data: WizardData }) {
  const issues: string[] = [];

  if (!data.coverImageFile) issues.push("Cover image is missing.");
  if (!data.propertyName.trim()) issues.push("Property name is missing.");
  if (!data.title.trim()) issues.push("Listing title is missing.");
  if (!data.fullAddress.trim()) issues.push("Full address is missing.");
  if (data.useType === "RESIDENTIAL") {
    const pt = data.propertyType;
    if (pt === "HOSTEL_MESS" && !data.rentPerSeat) issues.push("Rent per seat is missing.");
    if (pt !== "HOSTEL_MESS" && !data.monthlyRent) issues.push("Monthly rent is missing.");
  }

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700 dark:text-green-400">
        <Check className="h-4 w-4 shrink-0" />
        All required fields are complete. Ready to publish!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <p className="font-semibold">Please fix these issues before publishing:</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        {issues.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
