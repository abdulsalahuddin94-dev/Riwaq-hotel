import { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Monitor,
  Pencil,
  Search,
  Smartphone,
  UserCheck,
  UserPlus,
  UserX,
  Camera,
  Trash2,
} from "./msym";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  roleLabel,
  type Role,
  type Shift,
  signsInOnPhone,
  type Staff,
  wingLabel,
  wingShort,
} from "@/lib/demo-data";
import { actorFor, hms, useHms } from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { DesktopShell } from "./desktop-shell";
import { StaffAvatar } from "./illustrations";

/** Maintenance isn't in the staff app yet, so the Engineer role is not offered here (owner, 2026-11-18). */
const ROLE_ORDER: Role[] = ["ATTENDANT", "SUPERVISOR", "FRONT_DESK", "MANAGER", "ADMIN"];
const WINGS = [1, 2, 3, 4, 5];

type RoleFilter = "all" | Role;
type SecretInfo = {
  name: string;
  role: Role;
  secret: string;
  email?: string | undefined;
  isNew: boolean;
};
type OnCreated = (name: string, role: Role, secret: string, email: string | undefined) => void;

export function UsersPage() {
  return (
    <DesktopShell title="Users" eyebrow="Create accounts for the staff app and this dashboard">
      <UsersContent />
    </DesktopShell>
  );
}

function UsersContent() {
  const s = useHms();
  const actor = actorFor(s, "desktop");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [pinFor, setPinFor] = useState<SecretInfo | null>(null);

  const q = query.trim().toLowerCase();
  const list = s.staff
    .filter((p) => ROLE_ORDER.includes(p.role))
    .filter((p) => (showInactive ? true : p.active !== false))
    .filter((p) => filter === "all" || p.role === filter)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name),
    );
  const activeCount = (role?: Role) =>
    s.staff.filter(
      (p) => p.active !== false && ROLE_ORDER.includes(p.role) && (!role || p.role === role),
    ).length;
  const inactive = s.staff.filter((p) => p.active === false && ROLE_ORDER.includes(p.role)).length;

  const resetPin = (p: Staff) => {
    const pin = hms.resetPin(p.id, actor);
    setPinFor({ name: p.name, role: p.role, secret: pin, isNew: false });
  };
  const toggleActive = (p: Staff) => {
    const next = p.active === false;
    const released = hms.setStaffActive(p.id, next, actor);
    toast.success(
      next
        ? `${p.name} can sign in again`
        : `${p.name} deactivated${released ? ` · ${released} rooms back to Unassigned` : ""}`,
      { duration: 3500 },
    );
  };

  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <div>
            <h2>Team members</h2>
            <p>
              <strong>{activeCount()}</strong> active · new people appear on the staff app sign-in
              straight away.
            </p>
          </div>
          <div className="toolbar-actions">
            <label className="room-search users-search">
              <Search aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                aria-label="Search by name"
              />
            </label>
            <Button variant="hmsPrimary" size="hmsMd" onClick={() => setEditing("new")}>
              <UserPlus aria-hidden="true" /> Create user
            </Button>
          </div>
        </div>
        <div className="users-filters">
          <div className="segmented segmented-inline" role="radiogroup" aria-label="Filter by job">
            {(["all", ...ROLE_ORDER] as RoleFilter[]).map((k) => (
              <button
                type="button"
                role="radio"
                aria-checked={filter === k}
                key={k}
                className={cn(filter === k && "segmented-on")}
                onClick={() => setFilter(k)}
              >
                {k === "all" ? "All" : roleLabel[k]}{" "}
                <span className="fd-tab-count">{k === "all" ? activeCount() : activeCount(k)}</span>
              </button>
            ))}
          </div>
          {inactive ? (
            <label className="users-inactive-toggle">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />{" "}
              Show deactivated ({inactive})
            </label>
          ) : null}
        </div>
        {list.length === 0 ? (
          <EmptyState
            title="No one matches"
            action="Clear search"
            onAction={() => {
              setQuery("");
              setFilter("all");
            }}
          />
        ) : (
          <div className="data-table users-table">
            <div className="table-row table-header users-row">
              <span>Name</span>
              <span>Job</span>
              <span>Shift</span>
              <span>Wings</span>
              <span>Signs in on</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>
            {list.map((p) => {
              const off = p.active === false;
              return (
                <div className={cn("table-row users-row", off && "users-row-off")} key={p.id}>
                  <span className="staff-cell">
                    <StaffAvatar staff={p} className="users-avatar" />
                    <span className="users-name">
                      <b>{p.name}</b>
                      {(p.email ?? p.phone) ? <small dir="ltr">{p.email ?? p.phone}</small> : null}
                    </span>
                  </span>
                  <span>{roleLabel[p.role]}</span>
                  <span>{p.shift ?? "—"}</span>
                  <span>
                    {p.role === "SUPERVISOR"
                      ? (p.floors ?? []).map(wingShort).join(", ") || "—"
                      : p.role === "ATTENDANT"
                        ? "By assignment"
                        : "—"}
                  </span>
                  <span className="users-where">
                    {signsInOnPhone(p.role) ? (
                      <>
                        <Smartphone aria-hidden="true" /> Staff app
                      </>
                    ) : (
                      <>
                        <Monitor aria-hidden="true" /> Dashboard
                      </>
                    )}
                  </span>
                  <span
                    className={cn("users-status", off ? "users-status-off" : "users-status-on")}
                  >
                    {off ? <UserX aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{" "}
                    {off ? "Deactivated" : "Active"}
                  </span>
                  <span className="users-actions">
                    <Button
                      variant="hmsGhost"
                      size="hmsIcon"
                      aria-label={`Edit ${p.name}`}
                      title="Edit"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    {signsInOnPhone(p.role) && !off ? (
                      <Button
                        variant="hmsGhost"
                        size="hmsIcon"
                        aria-label={`Reset PIN for ${p.name}`}
                        title="Reset PIN"
                        onClick={() => resetPin(p)}
                      >
                        <KeyRound aria-hidden="true" />
                      </Button>
                    ) : null}
                    <Button
                      variant="hmsGhost"
                      size="hmsIcon"
                      aria-label={off ? `Reactivate ${p.name}` : `Deactivate ${p.name}`}
                      title={off ? "Reactivate" : "Deactivate"}
                      disabled={p.id === actor}
                      onClick={() => toggleActive(p)}
                    >
                      {off ? <UserCheck aria-hidden="true" /> : <UserX aria-hidden="true" />}
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <UserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onCreated={(name, role, secret, email) =>
          setPinFor({ name, role, secret, email, isNew: true })
        }
      />
      <PinDialog info={pinFor} onClose={() => setPinFor(null)} />
    </>
  );
}

/* ───────────── Create / edit ───────────── */

function UserDialog({
  user,
  onClose,
  onCreated,
}: {
  user: Staff | "new" | null;
  onClose: () => void;
  onCreated: OnCreated;
}) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        {user ? (
          <UserForm
            key={user === "new" ? "new" : user.id}
            user={user === "new" ? null : user}
            onClose={onClose}
            onCreated={onCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  user,
  onClose,
  onCreated,
}: {
  user: Staff | null;
  onClose: () => void;
  onCreated: OnCreated;
}) {
  const s = useHms();
  const actor = actorFor(s, "desktop");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "ATTENDANT");
  const [shift, setShift] = useState<Shift>(user?.shift ?? "Morning");
  const [floors, setFloors] = useState<number[]>(user?.floors ?? []);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [photo, setPhoto] = useState<string | undefined>(user?.photo);
  const onPhone = signsInOnPhone(role);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.split(" ").length < 2) return setError("Enter first and last name.");
    if (role === "SUPERVISOR" && !floors.length)
      return setError("Pick at least one wing for this supervisor.");
    if (!onPhone && !/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Enter a work email; they use it to sign in to the dashboard.");
    const dup = s.staff.find(
      (p) => p.id !== user?.id && p.name.toLowerCase() === clean.toLowerCase(),
    );
    if (dup) return setError(`${dup.name} already exists.`);
    const fields = {
      name: clean,
      role,
      shift,
      phone: phone.trim() || undefined,
      email: onPhone ? undefined : email.trim().toLowerCase(),
      floors: role === "SUPERVISOR" ? [...floors].sort() : undefined,
      photo,
    };
    if (user) {
      hms.updateStaff(user.id, fields, actor);
      toast.success(`${clean} updated`, { duration: 2500 });
      onClose();
    } else {
      const { secret } = hms.addStaff(fields, actor);
      onClose();
      onCreated(clean, role, secret, fields.email);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{user ? `Edit ${user.name}` : "Create user"}</DialogTitle>
        <DialogDescription>
          {user
            ? "Changes show on the staff app and this dashboard right away."
            : "Housekeeping and supervisors sign in on the staff app with a 4-digit PIN. Front desk, managers and admins sign in here with their email."}
        </DialogDescription>
      </DialogHeader>
      <form className="form-grid form-grid-2" onSubmit={submit} noValidate>
        <AvatarPicker
          photo={photo}
          preview={{
            id: user?.id ?? "new",
            role,
            initials:
              name
                .trim()
                .split(/\s+/)
                .map((w) => w[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?",
          }}
          onChange={setPhoto}
          onPhone={onPhone}
        />
        <label className="span-2">
          Full name
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Ligaya Santos"
            autoComplete="off"
          />
        </label>
        <label>
          Job
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role);
              setError(null);
            }}
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </label>
        {onPhone ? (
          <label>
            Mobile number <span className="label-optional">optional</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+974 5555 0000"
              inputMode="tel"
              dir="ltr"
            />
          </label>
        ) : (
          <label>
            Work email
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="name@marsadhahab.example"
              dir="ltr"
              autoComplete="off"
            />
          </label>
        )}
        <fieldset className="span-2 users-fieldset">
          <legend>Shift</legend>
          <div className="segmented segmented-inline" role="radiogroup" aria-label="Shift">
            {(["Morning", "Evening"] as Shift[]).map((k) => (
              <button
                type="button"
                role="radio"
                aria-checked={shift === k}
                key={k}
                className={cn(shift === k && "segmented-on")}
                onClick={() => setShift(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </fieldset>
        {role === "SUPERVISOR" ? (
          <fieldset className="span-2 users-fieldset">
            <legend>Wings they inspect</legend>
            <div className="chip-row">
              {WINGS.map((w) => {
                const on = floors.includes(w);
                return (
                  <button
                    type="button"
                    key={w}
                    aria-pressed={on}
                    className={cn("filter-chip", on && "filter-chip-on")}
                    onClick={() => {
                      setFloors((cur) => (on ? cur.filter((x) => x !== w) : [...cur, w]));
                      setError(null);
                    }}
                  >
                    {on ? "✓ " : ""}
                    {wingLabel(w)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {error ? (
          <p className="form-error span-2" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter className="span-2">
          <Button type="button" variant="hmsGhost" size="hmsMd" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="hmsPrimary" size="hmsMd">
            {user ? (
              "Save changes"
            ) : (
              <>
                <UserPlus aria-hidden="true" /> Create user
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ───────────── One-time PIN ───────────── */

function PinDialog({ info, onClose }: { info: SecretInfo | null; onClose: () => void }) {
  const phone = info ? signsInOnPhone(info.role) : true;
  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        {info ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {info.isNew ? `${info.name} is ready to sign in` : `New PIN for ${info.name}`}
              </DialogTitle>
              <DialogDescription>
                {phone
                  ? "Give this PIN to them in person. It is shown only once; you can reset it later."
                  : "Give them this temporary password in person. They change it the first time they sign in. It is shown only once."}
              </DialogDescription>
            </DialogHeader>
            {phone ? (
              <div className="pin-reveal" aria-label={`PIN ${info.secret.split("").join(" ")}`}>
                {info.secret.split("").map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
            ) : (
              <div className="pin-reveal pin-reveal-text">
                <span>{info.secret}</span>
              </div>
            )}
            <p className="pin-howto">
              {phone ? <Smartphone aria-hidden="true" /> : <Monitor aria-hidden="true" />}
              {phone ? (
                <>
                  On the staff app: <b>{roleLabel[info.role]}</b> → their photo → this PIN.
                </>
              ) : (
                <>
                  On the dashboard sign-in with <b dir="ltr">{info.email}</b>.
                </>
              )}
            </p>
            <DialogFooter>
              <Button variant="hmsPrimary" size="hmsMd" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Photo ───────────── */

/** Crops the picked image to a centred square and shrinks it to 160px, so it stays small in local storage. */
function toAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    img.src = url;
  });
}

function AvatarPicker({
  photo,
  preview,
  onChange,
  onPhone,
}: {
  photo: string | undefined;
  preview: { id: string; role: Role; initials: string };
  onChange: (photo: string | undefined) => void;
  onPhone: boolean;
}) {
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a photo (JPG or PNG)", { duration: 2500 });
      return;
    }
    try {
      onChange(await toAvatar(file));
    } catch {
      toast.error("That photo couldn't be read. Try another one.", { duration: 2500 });
    }
  };
  return (
    <div className="span-2 avatar-picker">
      <StaffAvatar staff={{ ...preview, photo }} className="avatar-picker-img" />
      <div className="avatar-picker-text">
        <strong>Photo</strong>
        <span>
          {onPhone
            ? "Shown on the staff app sign-in, so they can find their face."
            : "Shown next to their name on the dashboard."}
        </span>
        <div className="avatar-picker-actions">
          <label className="avatar-upload">
            <Camera aria-hidden="true" /> {photo ? "Change photo" : "Upload or take photo"}
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={pick}
              className="sr-only"
            />
          </label>
          {photo ? (
            <Button
              type="button"
              variant="hmsGhost"
              size="hmsSm"
              onClick={() => onChange(undefined)}
            >
              <Trash2 aria-hidden="true" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
