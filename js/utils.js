// js/utils.js
function drawPixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x),
    Math.floor(y),
    Math.max(1, Math.floor(width)), // Ensure width/height is at least 1
    Math.max(1, Math.floor(height))
  );
}

function drawPixel(ctx, x, y, color, pixelSize = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x * pixelSize),
    Math.floor(y * pixelSize),
    pixelSize,
    pixelSize
  );
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomColor(paletteArray) {
  if (
    !paletteArray ||
    !Array.isArray(paletteArray) ||
    paletteArray.length === 0
  ) {
    return "#000000";
  }
  return paletteArray[Math.floor(Math.random() * paletteArray.length)];
}

function lightenDarkenColor(hex, percent) {
  if (typeof hex !== "string") {
    return "#000000";
  }

  let usePound = false;
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
    usePound = true;
  }
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length !== 6) {
    if (hex.toLowerCase().startsWith("rgba"))
      return (usePound ? "#" : "") + hex;
    return (usePound ? "#" : "") + "000000";
  }

  const num = parseInt(hex, 16);
  if (isNaN(num)) {
    return (usePound ? "#" : "") + "000000";
  }

  let r = (num >> 16) + percent;
  r = Math.max(0, Math.min(255, r));

  let g = ((num >> 8) & 0x00ff) + percent;
  g = Math.max(0, Math.min(255, g));

  let b = (num & 0x0000ff) + percent;
  b = Math.max(0, Math.min(255, b));

  const R = Math.round(r).toString(16).padStart(2, "0");
  const G = Math.round(g).toString(16).padStart(2, "0");
  const B = Math.round(b).toString(16).padStart(2, "0");

  return (usePound ? "#" : "") + R + G + B;
}

function desaturateColor(hex, amount) {
  if (typeof hex !== "string") {
    return "#000000";
  }

  let usePound = false;
  const originalHexInputForWarning = hex;

  if (hex.startsWith("#")) {
    hex = hex.slice(1);
    usePound = true;
  }
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  if (hex.length !== 6) {
    if (hex.toLowerCase().startsWith("rgba"))
      return (usePound ? "#" : "") + hex;
    return (usePound ? "#" : "") + "000000";
  }

  const num = parseInt(hex, 16);
  if (isNaN(num)) {
    return (usePound ? "#" : "") + "000000";
  }
  let r = num >> 16;
  let g = (num >> 8) & 0x00ff;
  let b = num & 0x0000ff;

  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  r = Math.round(r + (gray - r) * amount);
  g = Math.round(g + (gray - g) * amount);
  b = Math.round(b + (gray - b) * amount);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  const R = r.toString(16).padStart(2, "0");
  const G = g.toString(16).padStart(2, "0");
  const B = b.toString(16).padStart(2, "0");

  return (usePound ? "#" : "") + R + G + B;
}

const Palettes = {
  vehicle: {
    CAR_BODY_MAIN: "#C0392B",
    CAR_BODY_ACCENT: "#E74C3C",
    CAR_WINDOW: "#7FB3D5",
    CAR_TIRE_DARK: "#2C3E50",
    CAR_TIRE_LIGHT: "#34495E",
    CAR_UNDERCARRIAGE: "#566573",
    CAR_ROOF: "#A93226",
    CAR_HEADLIGHT_ON: "#FFFFE0",
    CAR_HEADLIGHT_OFF: "#B0B0B0",
    CAR_TAILLIGHT_ON: "#FF0000",
    CAR_TAILLIGHT_BRAKE: "#FF4500",
    CAR_TAILLIGHT_OFF: "#8B0000",
    DUST_COLOR: ["#A0522D", "#8B4513", "#D2B48C"],
    EXHAUST_SMOKE: ["#555555", "#666666", "#777777"],
  },
  desert: {
    sky: ["#FAD7A0", "#F5B041", "#E6E6FA"], // Lightened Zenith
    ground: ["#D2B48C", "#C19A6B", "#A0522D" /*detail*/, "#8B4513" /*shadow*/],
    objects_primary: { base: "#B08D57", light: "#C8A165", shadow: "#967142" },
    objects_accent: ["#8B4513", "#F0E68C"],
    emissive: ["#FFBF00"],
    atmosphere: {
      hazeColor: "rgba(245, 176, 65, 0.08)",
      fogColor: "rgba(210, 180, 140, 0.03)",
    }, // Subtler
    generic_dust: ["#A0522D", "#8B4513", "#D2B48C"],
  },
  gaming: {
    sky: ["#5C94FC", "#3060E1"],
    ground: ["#34A245", "#2A8C39", "#83E270" /*detail*/, "#1F682A" /*shadow*/],
    objects_primary: { base: "#808080", light: "#A0A0A0", shadow: "#606060" },
    objects_accent: ["#FF00FF", "#00FF00"],
    emissive: ["#FFFF00", "#00FFFF", "#FF69B4"],
    props: ["#FF0000", "#FFFF00", "#00FF00", "#FF00FF"], // Ensured this is present
    atmosphere: {
      hazeColor: "rgba(48, 96, 225, 0.05)",
      fogColor: "rgba(0,0,0,0.0)",
    },
  },
  futuristic: {
    sky: ["#101020", "#202040", "#080810"],
    ground: [
      "#303038",
      "#282830",
      "#404050" /*lines/detail*/,
      "#181820" /*shadow*/,
    ],
    objects_primary: { base: "#A0A0C0", light: "#C0C0E0", shadow: "#707090" },
    objects_accent: ["#E0E0FF", "#00A0A0"],
    emissive: ["#00FFFF", "#FF00FF", "#FFFF00", "#7FFF00"],
    atmosphere: {
      hazeColor: "rgba(32, 32, 64, 0.12)",
      fogColor: "rgba(16, 16, 32, 0.15)",
    }, // Subtler
  },
  industrial: {
    sky: ["#778899", "#808080", "#607080"],
    ground: ["#606060", "#707070", "#505050" /*detail*/, "#404040" /*shadow*/],
    objects_primary: { base: "#6E6E6E", light: "#8C8C8C", shadow: "#545454" },
    objects_accent: ["#B7410E", "#A0522D"],
    emissive: ["#FFA500", "#FFD700"],
    atmosphere: {
      hazeColor: "rgba(100, 100, 100, 0.15)",
      fogColor: "rgba(80, 80, 80, 0.25)",
    }, // Subtler
    smoke: ["#A9A9A9", "#C0C0C0", "#D3D3D3"],
  },
  ui: {
    FRAME_DARK: "#202020",
    FRAME_LIGHT: "#505050",
    FRAME_HIGHLIGHT: "#707070",
    BUTTON_F_KEY_BG: "#4A4A4A",
    BUTTON_F_KEY_FG: "#E0E0E0",
    MINIMAP_PLAYER: "#00FF00",
    MINIMAP_STOP_DEFAULT: "#FFFF00",
    MINIMAP_STOP_GAMING: "#FF00FF",
    MINIMAP_STOP_FUTURISTIC: "#00FFFF",
    MINIMAP_STOP_INDUSTRIAL: "#FFA500",
    MINIMAP_TEXTURE: "rgba(0,0,0,0.2)",
  },
};

function interpolateColor(hex1, hex2, factor) {
  if (typeof hex1 !== "string" || typeof hex2 !== "string") {
    return typeof hex2 === "string"
      ? hex2
      : typeof hex1 === "string"
      ? hex1
      : "#000000";
  }
  factor = Math.max(0, Math.min(1, factor));

  const parseHexComponent = (hexStr) => {
    let h = hexStr.startsWith("#") ? hexStr.slice(1) : hexStr;
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length !== 6) {
      return [0, 0, 0];
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0, 0]; // Check for NaN after parsing
    return [r, g, b];
  };

  try {
    const [r1, g1, b1] = parseHexComponent(hex1);
    const [r2, g2, b2] = parseHexComponent(hex2);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    const componentToHex = (c) => {
      const hexVal = Math.max(0, Math.min(255, c)).toString(16);
      return hexVal.length === 1 ? "0" + hexVal : hexVal;
    };

    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
  } catch (e) {
    return typeof hex2 === "string" && hex2.startsWith("#")
      ? hex2
      : typeof hex2 === "string"
      ? "#" + hex2
      : "#000000";
  }
}

const PixelFontData = {
  A: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
  ],
  B: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  C: [
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 1, 1],
  ],
  D: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  E: [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  F: [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ],
  G: [
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 1, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 1],
  ],
  H: [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
  ],
  I: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  J: [
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  K: [
    [1, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 0, 1, 0],
    [1, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  N: [
    [1, 0, 0, 1],
    [1, 1, 0, 1],
    [1, 0, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  P: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
  ],
  Q: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 1, 1],
    [0, 1, 1, 1],
  ],
  R: [
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 1, 1, 0],
    [1, 0, 1, 0],
    [1, 0, 0, 1],
  ],
  S: [
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  U: [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  V: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  W: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  X: [
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
  ],
  Y: [
    [1, 0, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ],
  Z: [
    [1, 1, 1, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  0: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 1, 0],
  ],
  1: [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  2: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [1, 1, 1, 1],
  ],
  3: [
    [1, 1, 1, 0],
    [0, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  4: [
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [1, 0, 1, 0],
    [1, 1, 1, 1],
    [0, 0, 1, 0],
  ],
  5: [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 1],
    [1, 1, 1, 0],
  ],
  6: [
    [0, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  7: [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
  8: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  9: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  " ": [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  ".": [[0], [0], [0], [0], [1]],
  ",": [
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  "!": [[1], [1], [1], [0], [1]],
  "?": [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 1, 0],
  ],
  "-": [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  ":": [[0], [1], [0], [1], [0]],
  "[": [
    [1, 1, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
  ],
  "]": [
    [0, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 1, 1],
  ],
  DEFAULT_CHAR_WIDTH: 4,
  DEFAULT_CHAR_HEIGHT: 5,
};
PixelFontData.charHeight = 5;
PixelFontData.charSpacing = 1;
PixelFontData.lineHeight = 7;
