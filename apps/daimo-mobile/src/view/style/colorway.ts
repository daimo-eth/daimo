/** Colorway constants */
const baseColorway = {
  danger: "#f35369",
  warningLight: "#ffeeb3",
  yellow: "#FFDC62",
  success: "#14B174",
  successDark: "#13915F",
  white: "#ffffff",
  ivoryLight: "#f9f9f9",
  ivoryDark: "#f2f2f2",
  grayLight: "#e2e2e2", // TODO gray2 = d6d6d6
  gray3: "#aaaaaa",
  grayMid: "#717171", // TODO gray4
  grayDark: "#444", // TODO gray5
  midnight: "#262626", // TODO "black" = 111111
  link: "#027AFE",
  lightBlue: "#A3D3FF",
};

const greenColorway = {
  primary: "#13915F",
  primaryBgLight: "#CCF3D7",
  ...baseColorway,
};

const blueColorway = {
  primary: "#007aff",
  primaryBgLight: "#aaccff",
  ...baseColorway,
};

// Dark mode has the opposite colors
const darkColorway = {
  primary: "#f7931a",
  primaryBgLight: "#fcd29f",
  danger: "#f35369",
  warningLight: "#ffeeb3",
  yellow: "#FFDC62",
  success: "#0CA01B",
  successDark: "#009900",
  white: "#121212",
  ivoryLight: "#f2f2f2",
  ivoryDark: "#313131",
  grayLight: "#292929", // TODO
  gray3: "#B7B7B7",
  grayMid: "#CFCFCF",
  grayDark: "#E7E7E7",
  midnight: "#e9e9e9",
  link: "#027AFE",
  lightBlue: "#A3D3FF",
};

const orangeColorway = {
  primary: "#cb9800",
  primaryBgLight: "#e1b303",
  ...baseColorway,
};

const yellowColorway = {
  primary: "#ffd12f",
  primaryBgLight: "#FFEEB3",
  ...baseColorway,
};

export {
  greenColorway,
  blueColorway,
  darkColorway,
  orangeColorway,
  yellowColorway,
};
