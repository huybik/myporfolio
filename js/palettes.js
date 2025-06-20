// js/palettes.js
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
