import { useState } from "react";
import { AlertTriangle, ChevronRight, CircleUserRound, RotateCcw, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alerts, mobileRooms, rooms, staffProgress, workOrders } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, SkeletonState } from "./demo-states";
import { MobileShell, useMobilePersona } from "./mobile-shell";
import { RoomCard } from "./room-components";
import { StatusChip } from "./status";

type State = "default" | "loading" | "empty" | "error";

export function MobileRoomsPage() {
  const [state] = useState<State>("default");
  return (
    <MobileShell title="My Rooms">
      <div className="mobile-sync"><Wifi /> Synced <span>8 of 14 complete</span></div>
      <div className="mobile-progress-summary"><div><span style={{ inlineSize: "57%" }} /></div><b>57%</b></div>
      {state === "loading" ? <SkeletonState /> : null}
      {state === "empty" ? <EmptyState title="Your supervisor hasn't assigned rooms yet" /> : null}
      {state === "error" ? <ErrorState title="Couldn't load your rooms" onRetry={() => setState("default")} /> : null}
      {state === "default" ? <div className="mobile-room-list">{mobileRooms.map((room) => <RoomCard room={room} key={room.number} />)}</div> : null}
    </MobileShell>
  );
}

export function MobileAlertsPage() {
  return <MobileShell title="Alerts"><div className="mobile-alert-list">{alerts.map((alert) => <article className={cn("mobile-alert", `alert-${alert.tone}`)} key={alert.title}><AlertTriangle /><div><h2>{alert.title}</h2><p>{alert.detail}</p></div><ChevronRight /></article>)}</div></MobileShell>;
}

export function MobileMePage() {
  return <MobileShell title="Me"><MobileProfile /></MobileShell>;
}

function MobileProfile() {
  const persona = useMobilePersona();
  const profile = persona === "Supervisor"
    ? { initials: "MA", name: "Mona Adel", role: "Floor Supervisor", completed: "8", assigned: "8", metric: "96%", metricLabel: "Avg. score" }
    : persona === "Engineer"
      ? { initials: "FK", name: "Fady Khalil", role: "Maintenance Engineer", completed: "4", assigned: "6", metric: "2", metricLabel: "Priority" }
      : { initials: "AK", name: "Ahmed Kamal", role: "Housekeeper (Room Attendant)", completed: "8", assigned: "14", metric: "48", metricLabel: "Credits" };
  return <><div className="mobile-profile"><span className="demo-pill">DEMO</span><div className="profile-avatar">{profile.initials}</div><h2>{profile.name}</h2><p>{profile.role} · Morning shift</p></div><div className="mobile-stats"><article><strong>{profile.completed}</strong><span>Completed</span></article><article><strong>{profile.assigned}</strong><span>Assigned</span></article><article><strong>{profile.metric}</strong><span>{profile.metricLabel}</span></article></div><div className="mobile-settings-list"><button><Wifi /> Sync status <span>Synced</span></button><button><RotateCcw /> Reset demo data <ChevronRight /></button></div></>;
}

export function MobileInspectionsPage() {
  const inspectionRooms = rooms.filter((room) => room.status === "AWAITING_INSPECTION");
  return <MobileShell title="Inspection Queue"><div className="mobile-callout">2 queue rooms need priority inspection.</div><div className="mobile-room-list">{inspectionRooms.map((room) => <article className="inspection-card" key={room.number}><div><span>Room</span><h2><bdi>{room.number}</bdi></h2></div><StatusChip status={room.status} /><Button variant="hmsPrimary" size="hmsMd" onClick={() => toast.success(`Room ${room.number} approved`, { duration: 3000 })}>Inspect</Button></article>)}</div></MobileShell>;
}

export function MobileFloorPage() {
  return <MobileShell title="Floor Board"><div className="mobile-floor-grid">{rooms.slice(20, 40).map((room) => <article key={room.number}><strong><bdi>{room.number}</bdi></strong><StatusChip status={room.status} compact /><span>{room.initials}</span></article>)}</div></MobileShell>;
}

export function MobileWorkOrdersPage() {
  return <MobileShell title="My Jobs"><div className="mobile-room-list">{workOrders.map((order, index) => <article className="mobile-job-card" key={order.room}><span className={cn("priority", index < 2 && "priority-critical")}>P{index < 2 ? "1" : "3"}</span><div><h2>{order.title}</h2><p>Room <bdi>{order.room}</bdi> · {order.status}</p></div><Button variant="hmsPrimary" size="hmsMd">Open</Button></article>)}</div></MobileShell>;
}

export function MobileLoginPage() {
  return <MobileShell title="Shift sign-in"><div className="mobile-login"><p>Select your profile</p><div className="avatar-grid">{staffProgress.slice(0, 6).map((person) => <button key={person.name}><span>{person.initials}</span><b>{person.name.split(" ")[0]}</b></button>)}</div><Button variant="hmsPrimary" size="hmsXl"><CircleUserRound /> Continue with PIN</Button></div></MobileShell>;
}

export function DesktopLoginPage() {
  return <div className="login-screen" data-platform="desktop"><div className="login-panel"><span className="demo-pill">PRODUCTION DESIGN</span><h1>Welcome back</h1><p>Sign in to TrianglZ Hotel HMS.</p><label>Email<input type="email" placeholder="name@trianglzhotel.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><Button variant="hmsPrimary" size="hmsLg">Sign in</Button></div></div>;
}
