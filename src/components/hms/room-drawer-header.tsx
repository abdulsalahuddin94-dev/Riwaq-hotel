import { BedDouble, BedSingle, Building2, Crown, Landmark, Trees } from "lucide-react";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { taskLabel, wingLabel, type Room, type RoomStatus, type RoomType } from "@/lib/demo-data";
import { RoomBadges } from "./room-components";
import { StatusChip } from "./status";
import { taskIcon } from "./illustrations";
import { wingPhotos } from "./wing-photos";

const roomTypeIcons: Record<RoomType, typeof BedDouble> = {
  "Heritage Room": Landmark,
  "Twin Room": BedSingle,
  "Courtyard Room": Trees,
  Suite: Crown,
};

export function RoomDrawerHeader({ room, status }: { room: Room; status: RoomStatus }) {
  const TypeIcon = roomTypeIcons[room.type];
  const TaskIcon = taskIcon[room.taskType];
  return (
    <SheetHeader className="drawer-header drawer-photo-header">
      <div className="drawer-wing-photo" aria-hidden="true">
        <img src={wingPhotos[room.floor]} alt="" width={1536} height={1024} />
      </div>
      <div className="drawer-photo-details">
        <SheetDescription className="drawer-wing-name"><Building2 aria-hidden="true" />{wingLabel(room.floor)}</SheetDescription>
        <div className="drawer-title-row">
          <SheetTitle className="drawer-title">Room <bdi>{room.number}</bdi></SheetTitle>
          <StatusChip status={status} />
        </div>
        <div className="drawer-photo-tags">
          <span className="drawer-info-tag"><TypeIcon aria-hidden="true" />{room.type}</span>
          <span className="drawer-info-tag"><TaskIcon aria-hidden="true" />{taskLabel[room.taskType]}</span>
          <RoomBadges room={room} max={4} />
        </div>
      </div>
    </SheetHeader>
  );
}