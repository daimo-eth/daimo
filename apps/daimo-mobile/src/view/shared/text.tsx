import { ReactNode } from "react";
import { Text } from "react-native";

import { ss } from "./style";

export function TextH1({ children }: { children: ReactNode }) {
  return <Text style={ss.text.h1}>{children}</Text>;
}

export function TextH2({ children }: { children: ReactNode }) {
  return <Text style={ss.text.h2}>{children}</Text>;
}

export function TextBody({ children }: { children: ReactNode }) {
  return <Text style={ss.text.body}>{children}</Text>;
}

export function TextSmall({ children }: { children: ReactNode }) {
  return <Text style={ss.text.small}>{children}</Text>;
}

export function TextBold({ children }: { children: ReactNode }) {
  return <Text style={ss.text.bold}>{children}</Text>;
}

export function TextCenter({ children }: { children: ReactNode }) {
  return <Text style={ss.text.center}>{children}</Text>;
}

export function TextError({ children }: { children: ReactNode }) {
  return <Text style={ss.text.error}>{children}</Text>;
}
