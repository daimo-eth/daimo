/**
 * !! MOD DAIMO !!
 *
 * To make your own Daimo skin, choose a colorway, a font.
 */

import {
  greenColorway,
  blueColorway,
  purpleColorway,
  darkColorway,
} from "./colorway";

type SkinName = "green" | "blue" | "purple" | "dark";

type Colorway = typeof greenColorway;

interface SkinContextType {
  skinName: SkinName;
  color: Colorway;
  setTheme: (name: SkinName) => void;
}

const defaultTheme: SkinContextType = {
  skinName: "green",
  color: greenColorway,
  setTheme: () => {},
};
