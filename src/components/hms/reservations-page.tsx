import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Crown, LogIn, Phone, Plus, Search, X } from "./msym";
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
import { Switch } from "@/components/ui/switch";
import {
  addDays,
  DEMO_DATE,
  FOLLOW_UP_GRACE_MIN,
  fmtDay,
  fmtTime,
  followUpLabel,
  type FollowUpOutcome,
  type Reservation,
  type RoomType,
  wingShort,
} from "@/lib/demo-data";
import {
  actorFor,
  displayStatus,
  hms,
  isReady,
  needsFollowUp,
  staffName,
  useHms,
} from "@/lib/hms-store";
import { cn } from "@/lib/utils";
import { EmptyState } from "./demo-states";
import { DesktopShell, useDesktop } from "./desktop-shell";
import { StatusChip } from "./status";

const ROOM_TYPES: RoomType[] = ["Standard", "Deluxe", "Suite"];
type Tab = "today" | "followup" | "upcoming" | "closed";

export function ReservationsPage() {
  return (
    <DesktopShell title="Reservations" eyebrow="Bookings taken by phone, email or at the desk">
      <ReservationsContent />
    </DesktopShell>
  );
}

const STATE: Record<
  Reservation["status"],
  { label: string; icon: typeof Clock; className: string }
> = {
  expected: { label: "Expected", icon: Clock, className: "req-ack" },
  checked_in: { label: "Checked in", icon: CheckCircle2, className: "req-done" },
  no_show: { label: "No-show", icon: X, className: "req-cancelled" },
  cancelled: { label: "Cancelled", icon: X, className: "req-cancelled" },
};

function ReservationsContent() {
  const s = useHms();
  const { openRoom } = useDesktop();
  const actor = actorFor(s, "desktop");
  const followUps = s.reservations.filter((r) => needsFollowUp(s, r));
  const [tab, setTab] = useState<Tab>(followUps.length ? "followup" : "today");
  const [query, setQuery] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [followId, setFollowId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const byTab = (r: Reservation) => {
    if (tab === "followup") return needsFollowUp(s, r);
    if (tab === "today") return r.arrivalDate === DEMO_DATE && r.status !== "cancelled";
    if (tab === "upcoming") return r.arrivalDate > DEMO_DATE && r.status === "expected";
    return r.status !== "expected";
  };
  const list = s.reservations
    .filter(byTab)
    .filter(
      (r) =>
        !q ||
        r.guestName.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    )
    .sort(
      (a, b) =>
        a.arrivalDate.localeCompare(b.arrivalDate) ||
        a.expectedCheckIn.localeCompare(b.expectedCheckIn),
    );
  const counts: Record<Tab, number> = {
    followup: followUps.length,
    today: s.reservations.filter((r) => r.arrivalDate === DEMO_DATE && r.status !== "cancelled")
      .length,
    upcoming: s.reservations.filter((r) => r.arrivalDate > DEMO_DATE && r.status === "expected")
      .length,
    closed: s.reservations.filter((r) => r.status !== "expected").length,
  };

  /** Vacant, sellable rooms of the booked type that aren't already promised to another arrival. */
  const roomsFor = (res: Reservation) =>
    s.rooms.filter(
      (r) =>
        r.type === res.roomType &&
        r.occupancy === "VACANT" &&
        !r.block &&
        (!r.arrival || r.number === res.roomId) &&
        !r.queue,
    );

  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <div>
            <h2>Bookings</h2>
            <p>
              Guests not here {FOLLOW_UP_GRACE_MIN} min after their expected time move to{" "}
              <b>Follow up</b>, and the bell reminds you to call them.
            </p>
          </div>
          <div className="toolbar-actions">
            <label className="room-search users-search">
              <Search aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, code or phone"
                aria-label="Search bookings"
              />
            </label>
            <Button variant="hmsPrimary" size="hmsMd" onClick={() => setNewOpen(true)}>
              <Plus aria-hidden="true" /> New reservation
            </Button>
          </div>
        </div>
        <div className="users-filters">
          <div className="segmented segmented-inline" role="radiogroup" aria-label="Show bookings">
            {(["followup", "today", "upcoming", "closed"] as Tab[]).map((k) => (
              <button
                type="button"
                role="radio"
                aria-checked={tab === k}
                key={k}
                className={cn(
                  tab === k && "segmented-on",
                  k === "followup" && counts.followup && "seg-attention",
                )}
                onClick={() => setTab(k)}
              >
                {
                  {
                    followup: "Follow up",
                    today: "Arriving today",
                    upcoming: "Upcoming",
                    closed: "Checked in & closed",
                  }[k]
                }{" "}
                <span className="fd-tab-count">{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <EmptyState
            title={
              tab === "followup"
                ? "Every guest due so far has arrived or been called"
                : "No bookings here"
            }
            action="New reservation"
            onAction={() => setNewOpen(true)}
          />
        ) : (
          <ul className="res-list">
            {list.map((res) => {
              const late = needsFollowUp(s, res);
              const meta = late
                ? { label: "Not arrived", icon: Phone, className: "req-pending" }
                : STATE[res.status];
              const Icon = meta.icon;
              const room = res.roomId ? s.rooms.find((r) => r.number === res.roomId) : undefined;
              const last = res.followUps[res.followUps.length - 1];
              const canAssign = res.status === "expected" && res.arrivalDate <= DEMO_DATE;
              return (
                <li key={res.id} className={cn("res-row", late && "res-row-late")}>
                  <div className="res-when">
                    <strong>
                      {res.arrivalDate === DEMO_DATE ? "Today" : fmtDay(res.arrivalDate)}
                    </strong>
                    <span>{res.expectedCheckIn}</span>
                  </div>
                  <div className="res-guest">
                    <strong>
                      {res.guestName}
                      {res.vip ? (
                        <span className="res-vip">
                          <Crown aria-hidden="true" /> VIP
                        </span>
                      ) : null}
                    </strong>
                    <span>
                      <bdi dir="ltr">{res.phone}</bdi> · {res.code} · {res.roomType} · {res.guests}{" "}
                      guest{res.guests > 1 ? "s" : ""} · {res.nights} night
                      {res.nights > 1 ? "s" : ""} (out{" "}
                      {fmtDay(addDays(res.arrivalDate, res.nights))})
                    </span>
                    {res.notes ? <span className="res-note">{res.notes}</span> : null}
                    {last ? (
                      <span className="res-note">
                        Last call {fmtTime(last.at)} by {staffName(s, last.by)} ·{" "}
                        {followUpLabel[last.outcome]}
                        {last.newTime ? ` · now ${last.newTime}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="res-room">
                    {canAssign ? (
                      <label className="inline-select">
                        <span className="sr-only">Room for {res.guestName}</span>
                        <select
                          value={res.roomId ?? ""}
                          onChange={(e) => {
                            hms.assignReservationRoom(res.id, e.target.value || null, actor);
                            if (e.target.value)
                              toast.success(`Room ${e.target.value} held for ${res.guestName}`, {
                                duration: 2500,
                              });
                          }}
                        >
                          <option value="">Assign room</option>
                          {roomsFor(res).map((r) => (
                            <option key={r.number} value={r.number}>
                              {r.number} · {wingShort(r.floor)} ·{" "}
                              {isReady(s, r) ? "ready" : "being prepared"}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : res.roomId ? (
                      <span>Room {res.roomId}</span>
                    ) : (
                      <span className="muted-line">
                        {res.arrivalDate > DEMO_DATE ? "Room on the day" : "—"}
                      </span>
                    )}
                    {room && res.status === "expected" ? (
                      <button
                        type="button"
                        className="link-btn res-room-status"
                        onClick={() => openRoom(room.number)}
                      >
                        <StatusChip status={displayStatus(room, s.settings)} />
                      </button>
                    ) : null}
                  </div>
                  <span className={cn("request-state", meta.className)}>
                    <Icon aria-hidden="true" /> {meta.label}
                  </span>
                  <div className="res-actions">
                    {res.status === "expected" &&
                    room &&
                    isReady(s, room) &&
                    res.arrivalDate <= DEMO_DATE ? (
                      <Button
                        variant="hmsPrimary"
                        size="hmsSm"
                        onClick={() => {
                          hms.checkIn(room.number, actor, res.guestName);
                          toast.success(`${res.guestName} checked in · Room ${room.number}`, {
                            duration: 3000,
                          });
                        }}
                      >
                        <LogIn aria-hidden="true" /> Check in
                      </Button>
                    ) : null}
                    {res.status === "expected" ? (
                      <Button
                        variant={late ? "hmsSecondary" : "hmsGhost"}
                        size="hmsSm"
                        onClick={() => setFollowId(res.id)}
                      >
                        <Phone aria-hidden="true" /> {late ? "Follow up" : "Log call"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <NewReservationDialog open={newOpen} onOpenChange={setNewOpen} />
      <FollowUpDialog id={followId} onClose={() => setFollowId(null)} />
    </>
  );
}

/* ───────────── New reservation ───────────── */

function NewReservationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const s = useHms();
  const blank = {
    guestName: "",
    phone: "",
    email: "",
    arrivalDate: DEMO_DATE,
    nights: 1,
    guests: 1,
    roomType: "Standard" as RoomType,
    expectedCheckIn: "14:00",
    vip: false,
    source: "Phone" as Reservation["source"],
    notes: "",
  };
  const [f, setF] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const upd = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => {
    setF((cur) => ({ ...cur, [k]: v }));
    setError(null);
  };
  const close = () => {
    setF(blank);
    setError(null);
    onOpenChange(false);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.guestName.trim().replace(/\s+/g, " ");
    if (name.split(" ").length < 2) return setError("Enter the guest's full name.");
    if (f.phone.replace(/\D/g, "").length < 7)
      return setError("Enter a phone number so we can follow up.");
    if (f.arrivalDate < DEMO_DATE) return setError("Arrival can't be in the past.");
    const code = hms.createReservation(
      {
        guestName: name,
        phone: f.phone.trim(),
        email: f.email.trim() || undefined,
        roomType: f.roomType,
        guests: f.guests,
        arrivalDate: f.arrivalDate,
        nights: f.nights,
        expectedCheckIn: f.expectedCheckIn,
        expectedCheckOut: "12:00",
        vip: f.vip,
        source: f.source,
        notes: f.notes.trim() || undefined,
      },
      actorFor(s, "desktop"),
    );
    toast.success(`Booked · ${code} · ${name}`, { duration: 3000 });
    close();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        <DialogHeader>
          <DialogTitle>New reservation</DialogTitle>
          <DialogDescription>
            Take the guest's details. Assign a room on the day of arrival; housekeeping then sees
            the arrival on that room.
          </DialogDescription>
        </DialogHeader>
        <form className="form-grid form-grid-2" onSubmit={submit} noValidate>
          <label className="span-2">
            Guest name
            <input
              autoFocus
              value={f.guestName}
              onChange={(e) => upd("guestName", e.target.value)}
              placeholder="e.g. Ms. Laila Mansour"
              autoComplete="off"
            />
          </label>
          <label>
            Phone
            <input
              value={f.phone}
              onChange={(e) => upd("phone", e.target.value)}
              placeholder="+974 5555 0000"
              inputMode="tel"
              dir="ltr"
            />
          </label>
          <label>
            Email <span className="label-optional">optional</span>
            <input
              type="email"
              value={f.email}
              onChange={(e) => upd("email", e.target.value)}
              placeholder="guest@example.com"
              dir="ltr"
            />
          </label>
          <label>
            Arrival date
            <input
              type="date"
              value={f.arrivalDate}
              min={DEMO_DATE}
              onChange={(e) => upd("arrivalDate", e.target.value)}
            />
          </label>
          <label>
            Expected arrival time
            <input
              type="time"
              value={f.expectedCheckIn}
              onChange={(e) => upd("expectedCheckIn", e.target.value)}
            />
          </label>
          <label>
            Nights
            <input
              type="number"
              min={1}
              max={60}
              value={f.nights}
              onChange={(e) => upd("nights", Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label>
            Guests
            <input
              type="number"
              min={1}
              max={8}
              value={f.guests}
              onChange={(e) => upd("guests", Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label>
            Room type
            <select
              value={f.roomType}
              onChange={(e) => upd("roomType", e.target.value as RoomType)}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Booked by
            <select
              value={f.source}
              onChange={(e) => upd("source", e.target.value as Reservation["source"])}
            >
              {(["Phone", "Email", "Walk-in", "Website"] as const).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Notes <span className="label-optional">optional</span>
            <input
              value={f.notes}
              onChange={(e) => upd("notes", e.target.value)}
              placeholder="e.g. Late flight, baby cot"
            />
          </label>
          <label className="span-2 request-urgent">
            <Switch checked={f.vip} onCheckedChange={(v) => upd("vip", v)} /> VIP guest
          </label>
          <p className="muted-line span-2">
            <CalendarDays aria-hidden="true" className="inline-icon" /> {fmtDay(f.arrivalDate)} →{" "}
            {fmtDay(addDays(f.arrivalDate, f.nights))}
          </p>
          {error ? (
            <p className="form-error span-2" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter className="span-2">
            <Button type="button" variant="hmsGhost" size="hmsMd" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant="hmsPrimary" size="hmsMd">
              Save reservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── Follow-up call ───────────── */

function FollowUpDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const s = useHms();
  const res = s.reservations.find((r) => r.id === id);
  return (
    <Dialog open={!!res} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-platform="desktop" className="hms-dialog">
        {res ? <FollowUpForm key={res.id} res={res} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FollowUpForm({ res, onClose }: { res: Reservation; onClose: () => void }) {
  const s = useHms();
  const [outcome, setOutcome] = useState<FollowUpOutcome>("coming");
  const [newTime, setNewTime] = useState("");
  const [note, setNote] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (outcome === "coming" && !newTime) {
      toast.error("Add the new arrival time", { duration: 2500 });
      return;
    }
    hms.logFollowUp(
      res.id,
      {
        outcome,
        newTime: outcome === "coming" ? newTime : undefined,
        note: note.trim() || undefined,
      },
      actorFor(s, "desktop"),
    );
    toast.success(`${res.guestName} · ${followUpLabel[outcome]}`, { duration: 2500 });
    onClose();
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>Follow up · {res.guestName}</DialogTitle>
        <DialogDescription>
          Expected {res.arrivalDate === DEMO_DATE ? "today" : fmtDay(res.arrivalDate)} at{" "}
          {res.expectedCheckIn}. Call{" "}
          <bdi dir="ltr">
            <a href={`tel:${res.phone.replace(/\s/g, "")}`}>{res.phone}</a>
          </bdi>{" "}
          and log what happened.
        </DialogDescription>
      </DialogHeader>
      <form className="form-grid" onSubmit={submit}>
        <fieldset className="users-fieldset">
          <legend>Result of the call</legend>
          <div className="chip-row">
            {(["coming", "no_answer", "cancelled", "no_show"] as FollowUpOutcome[]).map((o) => (
              <button
                type="button"
                key={o}
                aria-pressed={outcome === o}
                className={cn("filter-chip", outcome === o && "filter-chip-on")}
                onClick={() => setOutcome(o)}
              >
                {outcome === o ? "✓ " : ""}
                {followUpLabel[o]}
              </button>
            ))}
          </div>
        </fieldset>
        {outcome === "coming" ? (
          <label>
            New arrival time
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              autoFocus
            />
          </label>
        ) : null}
        {outcome === "no_show" || outcome === "cancelled" ? (
          <p className="muted-line">
            The booking closes
            {res.roomId ? ` and room ${res.roomId} is released for other guests` : ""}.
          </p>
        ) : null}
        {outcome === "no_answer" ? (
          <p className="muted-line">It stays in Follow up so someone tries again.</p>
        ) : null}
        <label>
          Note <span className="label-optional">optional</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Flight delayed, landing 15:40"
          />
        </label>
        <DialogFooter>
          <Button type="button" variant="hmsGhost" size="hmsMd" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="hmsPrimary" size="hmsMd">
            Save
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
