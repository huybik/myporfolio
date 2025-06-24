// src/utils.ts

export function drawPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x),
    Math.floor(y),
    Math.max(1, Math.floor(width)), // Ensure width/height is at least 1
    Math.max(1, Math.floor(height))
  );
}

export function drawPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pixelSize = 1
) {
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.floor(x * pixelSize),
    Math.floor(y * pixelSize),
    pixelSize,
    pixelSize
  );
}

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getRandomColor(paletteArray: string[]): string {
  if (
    !paletteArray ||
    !Array.isArray(paletteArray) ||
    paletteArray.length === 0
  ) {
    return "#000000";
  }
  return paletteArray[Math.floor(Math.random() * paletteArray.length)];
}

export function lightenDarkenColor(hex: string, percent: number): string {
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

export function desaturateColor(hex: string, amount: number): string {
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

export function interpolateColor(
  hex1: string,
  hex2: string,
  factor: number
): string {
  if (typeof hex1 !== "string" || typeof hex2 !== "string") {
    return typeof hex2 === "string"
      ? hex2
      : typeof hex1 === "string"
      ? hex1
      : "#000000";
  }
  factor = Math.max(0, Math.min(1, factor));

  const parseHexComponent = (hexStr: string): [number, number, number] => {
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

    const componentToHex = (c: number): string => {
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
