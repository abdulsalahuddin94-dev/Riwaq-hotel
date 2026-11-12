import courtyard from "@/assets/photos/courtyard-dawn.webp";
import najdi from "@/assets/photos/wing-najdi.jpg";
import palmGarden from "@/assets/photos/wing-palm-garden.jpg";
import fortTower from "@/assets/photos/wing-fort-tower.jpg";
import royal from "@/assets/photos/wing-royal.jpg";

/** Wing identity is independent of room type; preserve existing floor assignments. */
export const wingPhotos: Record<number, string> = {
  1: courtyard,
  2: najdi,
  3: palmGarden,
  4: fortTower,
  5: royal,
};