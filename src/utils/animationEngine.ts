import { Keyframe, SvgNode, EasingType, SvgElementAttributes } from '../types/editor';

// Easing math
export function computeEasing(t: number, easing: EasingType): number {
  const clampT = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return clampT;
    case 'ease-in':
      return clampT * clampT;
    case 'ease-out':
      return clampT * (2 - clampT);
    case 'ease-in-out':
      return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT;
    case 'spring': {
      const c4 = (2 * Math.PI) / 3;
      return clampT === 0 ? 0 : clampT === 1 ? 1 : Math.pow(2, -10 * clampT) * Math.sin((clampT * 10 - 0.75) * c4) + 1;
    }
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      let x = clampT;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
    }
    default:
      return clampT;
  }
}

// Color interpolation
function interpolateColor(colorA: string, colorB: string, factor: number): string {
  if (!colorA || !colorB || colorA === 'none' || colorB === 'none') {
    return factor < 0.5 ? colorA : colorB;
  }

  function parseHex(c: string) {
    let hex = c.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  try {
    const rgb1 = parseHex(colorA);
    const rgb2 = parseHex(colorB);
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return factor < 0.5 ? colorA : colorB;
  }
}

// Interpolate generic property value
export function interpolateValue(valA: any, valB: any, progress: number): any {
  if (typeof valA === 'number' && typeof valB === 'number') {
    return valA + (valB - valA) * progress;
  }

  if (typeof valA === 'string' && typeof valB === 'string') {
    if (valA.startsWith('#') || valB.startsWith('#')) {
      return interpolateColor(valA, valB, progress);
    }
    // Path d interpolation if both have matching numbers
    if (valA.startsWith('M') && valB.startsWith('M')) {
      const numsA = valA.match(/-?\d+(\.\d+)?/g);
      const numsB = valB.match(/-?\d+(\.\d+)?/g);
      if (numsA && numsB && numsA.length === numsB.length) {
        let index = 0;
        return valA.replace(/-?\d+(\.\d+)?/g, () => {
          const a = parseFloat(numsA[index]);
          const b = parseFloat(numsB[index]);
          index++;
          return (a + (b - a) * progress).toFixed(2);
        });
      }
    }
  }

  return progress < 0.5 ? valA : valB;
}

// Evaluate animated attributes for a node at currentTimeMs
export function getAnimatedNodeAttributes(
  node: SvgNode,
  currentTimeMs: number,
  allKeyframes: Keyframe[]
): SvgElementAttributes {
  const nodeKeyframes = allKeyframes.filter(k => k.elementId === node.id);
  if (nodeKeyframes.length === 0) {
    return node.attributes;
  }

  const computedAttrs: SvgElementAttributes = { ...node.attributes };

  // Group by property
  const properties = Array.from(new Set(nodeKeyframes.map(k => k.property)));

  for (const prop of properties) {
    const kfs = nodeKeyframes
      .filter(k => k.property === prop)
      .sort((a, b) => a.timeMs - b.timeMs);

    if (kfs.length === 0) continue;

    // Before first keyframe
    if (currentTimeMs <= kfs[0].timeMs) {
      computedAttrs[prop as keyof SvgElementAttributes] = kfs[0].value as any;
      continue;
    }

    // After last keyframe
    if (currentTimeMs >= kfs[kfs.length - 1].timeMs) {
      computedAttrs[prop as keyof SvgElementAttributes] = kfs[kfs.length - 1].value as any;
      continue;
    }

    // Find bounding keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
      const start = kfs[i];
      const end = kfs[i + 1];
      if (currentTimeMs >= start.timeMs && currentTimeMs <= end.timeMs) {
        const span = end.timeMs - start.timeMs;
        const rawProgress = span > 0 ? (currentTimeMs - start.timeMs) / span : 1;
        const easedProgress = computeEasing(rawProgress, end.easing || 'ease-in-out');
        const interpolated = interpolateValue(start.value, end.value, easedProgress);
        computedAttrs[prop as keyof SvgElementAttributes] = interpolated;
        break;
      }
    }
  }

  return computedAttrs;
}

// Generate standalone SVG with CSS keyframe animations
export function generateAnimatedSvgString(
  nodes: SvgNode[],
  canvasWidth: number,
  canvasHeight: number,
  durationMs: number,
  keyframes: Keyframe[]
): string {
  if (keyframes.length === 0) {
    return '';
  }

  const durationSec = (durationMs / 1000).toFixed(2);
  const elementsWithKeyframes = Array.from(new Set(keyframes.map(k => k.elementId)));

  let cssRules = '';
  for (const elementId of elementsWithKeyframes) {
    const elemKeyframes = keyframes.filter(k => k.elementId === elementId).sort((a, b) => a.timeMs - b.timeMs);
    const animName = `anim_${elementId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Collect percentages
    const times = Array.from(new Set([0, ...elemKeyframes.map(k => k.timeMs), durationMs])).sort((a, b) => a - b);
    let keyframeSteps = '';

    for (const t of times) {
      const pct = ((t / durationMs) * 100).toFixed(1);
      const propsAtT: string[] = [];

      for (const kf of elemKeyframes) {
        if (kf.property === 'opacity') {
          propsAtT.push(`opacity: ${kf.value};`);
        } else if (kf.property === 'fill') {
          propsAtT.push(`fill: ${kf.value};`);
        } else if (kf.property === 'stroke') {
          propsAtT.push(`stroke: ${kf.value};`);
        } else if (kf.property === 'rotation') {
          propsAtT.push(`transform: rotate(${kf.value}deg);`);
        }
      }

      if (propsAtT.length > 0) {
        keyframeSteps += `    ${pct}% { ${propsAtT.join(' ')} }\n`;
      }
    }

    cssRules += `
  #${elementId} {
    animation: ${animName} ${durationSec}s infinite ease-in-out;
    transform-origin: center;
  }
  @keyframes ${animName} {
${keyframeSteps}
  }
`;
  }

  return cssRules;
}
