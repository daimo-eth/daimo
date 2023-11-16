"use client";
import { useZupassPopupSetup } from "zukit";

export default function PassportPopup() {
  return <div>{useZupassPopupSetup()}</div>;
}
