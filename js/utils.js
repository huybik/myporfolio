// js/utils.js
function drawPixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x),
    Math.floor(y),
    Math.floor(width),
    Math.floor(height)
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

function getRandomColor(palette) {
  if (!palette || palette.length === 0) return "#000000";
  return palette[Math.floor(Math.random() * palette.length)];
}

function lightenDarkenColor(hex, percent) {
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
    return (usePound ? "#" : "") + "000000";
  }

  const num = parseInt(hex, 16);
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

const Palettes = {
  desert: ["#D2B48C", "#C19A6B", "#A0522D", "#8B4513", "#F0E68C"],
  gaming: {
    terrain: ["#34A245", "#2A8C39", "#83E270"],
    sky: ["#5C94FC", "#3060E1"],
    structures: ["#808080", "#A0A0A0", "#606060"],
    props: ["#FF0000", "#FFFF00", "#00FF00", "#FF00FF"],
  },
  futuristic: {
    buildings: ["#A0A0C0", "#B0B0D0", "#707090", "#303050"],
    lights: ["#00FFFF", "#FF00FF", "#FFFF00", "#7FFF00"],
    accents: ["#E0E0FF", "#C0C0FF"],
    sky: ["#202040", "#303050"],
  },
  industrial: {
    buildings: ["#606060", "#707070", "#505050", "#404040"],
    metal: ["#888888", "#999999", "#A0A0A0"],
    rust: ["#B7410E", "#A0522D"],
    smoke: ["#A9A9A9", "#C0C0C0", "#D3D3D3"],
    sky: ["#778899", "#808080"],
  },
};

function interpolateColor(hex1, hex2, factor) {
  factor = Math.max(0, Math.min(1, factor));

  const parseHexComponent = (hexComp) => {
    if (hexComp.length === 3)
      hexComp = hexComp
        .split("")
        .map((c) => c + c)
        .join("");
    if (hexComp.length !== 6) return [0, 0, 0];
    return [
      parseInt(hexComp.substring(0, 2), 16),
      parseInt(hexComp.substring(2, 4), 16),
      parseInt(hexComp.substring(4, 6), 16),
    ];
  };

  const h1 = hex1.startsWith("#") ? hex1.slice(1) : hex1;
  const h2 = hex2.startsWith("#") ? hex2.slice(1) : hex2;

  try {
    const [r1, g1, b1] = parseHexComponent(h1);
    const [r2, g2, b2] = parseHexComponent(h2);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    const componentToHex = (c) => {
      const hexVal = Math.max(0, Math.min(255, c)).toString(16);
      return hexVal.length === 1 ? "0" + hexVal : hexVal;
    };

    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
  } catch (e) {
    console.error(
      "Error in interpolateColor:",
      e.message,
      "Inputs:",
      hex1,
      hex2,
      factor,
      "Defaulting to hex2:",
      hex2
    );
    return hex2.startsWith("#") ? hex2 : "#" + hex2;
  }
}
