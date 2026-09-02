export interface ArrowDimensions {
  size: number;
  thickness: number;
  headWidth: number;
  headLength: number;
  cornerRadius?: number;
  roundedTail?: boolean;
}

/**
 * Returns the exact SVG path string for the callout arrow with a rounded tail (départ arrondi)
 * and optional fillet on the head tips.
 * Standard fixed size: 40px (length) × 16px (head width), 7px shaft thickness, 15px head length.
 */
export function getArrowSvgPath(
  arrow: {
    size?: number;
    thickness?: number;
    headWidth?: number;
    headLength?: number;
    cornerRadius?: number;
    roundedTail?: boolean;
  },
  scale: number = 1
): string {
  const L = (arrow.size || 40) * scale;
  const T = (arrow.thickness || 7) * scale;
  const HW = (arrow.headWidth || 16) * scale;
  const HL = (arrow.headLength || 15) * scale;
  const roundedTail = arrow.roundedTail !== false; // true by default (as in photo)

  const tipX = L / 2;
  const neckX = L / 2 - HL;
  const tailR = roundedTail ? T / 2 : 0;
  const tailX = -L / 2 + tailR;

  // In screen coordinates (+y downwards):
  // Tip: (tipX, 0)
  // Top barb: (neckX, -HW / 2)
  // Top neck: (neckX, -T / 2)
  // Tail top: (tailX, -T / 2)
  // Tail arc: to (tailX, T / 2)
  // Tail bottom: (tailX, T / 2)
  // Bottom neck: (neckX, T / 2)
  // Bottom barb: (neckX, HW / 2)

  if (roundedTail) {
    const r = tailR;
    return `M ${tipX.toFixed(2)} 0 ` +
      `L ${neckX.toFixed(2)} ${(-HW / 2).toFixed(2)} ` +
      `L ${neckX.toFixed(2)} ${(-T / 2).toFixed(2)} ` +
      `L ${tailX.toFixed(2)} ${(-T / 2).toFixed(2)} ` +
      `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${tailX.toFixed(2)} ${(T / 2).toFixed(2)} ` +
      `L ${neckX.toFixed(2)} ${(T / 2).toFixed(2)} ` +
      `L ${neckX.toFixed(2)} ${(HW / 2).toFixed(2)} ` +
      `Z`;
  }

  // Straight flat tail fallback
  return `M ${tipX.toFixed(2)} 0 ` +
    `L ${neckX.toFixed(2)} ${(-HW / 2).toFixed(2)} ` +
    `L ${neckX.toFixed(2)} ${(-T / 2).toFixed(2)} ` +
    `L ${(-L / 2).toFixed(2)} ${(-T / 2).toFixed(2)} ` +
    `L ${(-L / 2).toFixed(2)} ${(T / 2).toFixed(2)} ` +
    `L ${neckX.toFixed(2)} ${(T / 2).toFixed(2)} ` +
    `L ${neckX.toFixed(2)} ${(HW / 2).toFixed(2)} ` +
    `Z`;
}

/**
 * Helper to draw vector callout arrows on Canvas (pixel-perfect at any resolution)
 */
export function drawArrowShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number = 40,
  thickness: number = 7,
  headWidth: number = 16,
  headLength: number = 15,
  rotationDeg: number = 180,
  color: string = '#cc0000',
  opacity: number = 1.0,
  hasShadow: boolean = false,
  scale: number = 1,
  cornerRadius: number = 0,
  roundedTail: boolean = true
) {
  const rad = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);
  ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));

  if (hasShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.40)';
    ctx.shadowBlur = 3 * scale;
    ctx.shadowOffsetX = 1 * scale;
    ctx.shadowOffsetY = 1.5 * scale;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fillStyle = color || '#cc0000';

  const pathStr = getArrowSvgPath(
    {
      size: size || 40,
      thickness: thickness || 7,
      headWidth: headWidth || 16,
      headLength: headLength || 15,
      cornerRadius,
      roundedTail,
    },
    scale
  );

  try {
    const path2d = new Path2D(pathStr);
    ctx.fill(path2d);
  } catch (e) {
    // Fallback if Path2D is not supported
    const L = (size || 40) * scale;
    const T = (thickness || 7) * scale;
    const HW = (headWidth || 16) * scale;
    const HL = (headLength || 15) * scale;
    const tipX = L / 2;
    const neckX = L / 2 - HL;
    const tailR = roundedTail ? T / 2 : 0;
    const tailX = -L / 2 + tailR;

    ctx.beginPath();
    ctx.moveTo(tipX, 0);
    ctx.lineTo(neckX, -HW / 2);
    ctx.lineTo(neckX, -T / 2);
    ctx.lineTo(tailX, -T / 2);
    if (roundedTail) {
      ctx.arc(tailX, 0, tailR, -Math.PI / 2, Math.PI / 2, true);
    } else {
      ctx.lineTo(-L / 2, -T / 2);
      ctx.lineTo(-L / 2, T / 2);
    }
    ctx.lineTo(neckX, T / 2);
    ctx.lineTo(neckX, HW / 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
