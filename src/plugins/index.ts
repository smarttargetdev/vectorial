import { VecturaPlugin, PluginContext, PluginExporter, PluginEffect, PluginTool } from '../types/plugin';
import { SvgNode, Point } from '../types/editor';
import { generateId, nodesToSvgString } from '../utils/svgParser';

// Plugin 1: React Native & Cross-Platform Mobile Exporter
const reactNativeExporterPlugin: VecturaPlugin = {
  id: 'react-native-exporter',
  name: 'React Native & Mobile Exporter',
  version: '1.2.0',
  author: 'Vectura Studio Core',
  description: 'Converts SVG document hierarchy into production-ready react-native-svg JSX components and Flutter CustomPainter code.',
  icon: 'Smartphone',
  enabled: true,
  exporters: [
    {
      id: 'react-native-svg-jsx',
      name: 'React Native SVG Component (.tsx)',
      fileExtension: 'tsx',
      mimeType: 'text/typescript',
      description: 'Exports clean react-native-svg JSX components compatible with iOS and Android Expo/Bare apps.',
      export: async (doc) => {
        function convertNodeToReactNative(node: SvgNode, indent = '      '): string {
          if (node.isVisible === false) return '';
          const attrs = node.attributes;
          const componentName = node.type === 'g' ? 'G' : node.type.charAt(0).toUpperCase() + node.type.slice(1);
          const propPairs: string[] = [];

          if (attrs.x !== undefined) propPairs.push(`x={${attrs.x}}`);
          if (attrs.y !== undefined) propPairs.push(`y={${attrs.y}}`);
          if (attrs.width !== undefined) propPairs.push(`width={${attrs.width}}`);
          if (attrs.height !== undefined) propPairs.push(`height={${attrs.height}}`);
          if (attrs.cx !== undefined) propPairs.push(`cx={${attrs.cx}}`);
          if (attrs.cy !== undefined) propPairs.push(`cy={${attrs.cy}}`);
          if (attrs.r !== undefined) propPairs.push(`r={${attrs.r}}`);
          if (attrs.rx !== undefined) propPairs.push(`rx={${attrs.rx}}`);
          if (attrs.d) propPairs.push(`d="${attrs.d}"`);
          if (attrs.fill) propPairs.push(`fill="${attrs.fill}"`);
          if (attrs.stroke) propPairs.push(`stroke="${attrs.stroke}"`);
          if (attrs.strokeWidth) propPairs.push(`strokeWidth={${attrs.strokeWidth}}`);
          if (attrs.opacity !== undefined && attrs.opacity !== 1) propPairs.push(`opacity={${attrs.opacity}}`);

          const propsStr = propPairs.length ? ' ' + propPairs.join(' ') : '';

          if (node.children && node.children.length > 0) {
            const inner = node.children.map(c => convertNodeToReactNative(c, indent + '  ')).join('\n');
            return `${indent}<${componentName}${propsStr}>\n${inner}\n${indent}</${componentName}>`;
          }

          if (node.type === 'text') {
            return `${indent}<Text${propsStr}>${attrs.textContent || ''}</Text>`;
          }

          return `${indent}<${componentName}${propsStr} />`;
        }

        const elementsJsx = doc.rootNodes.map(n => convertNodeToReactNative(n)).join('\n');
        const code = `import React from 'react';
import Svg, { Path, Rect, Circle, G, Text, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface VectorIconProps {
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  style?: ViewStyle;
}

export const ${doc.title.replace(/[^a-zA-Z0-9]/g, '') || 'VectorGraphic'}: React.FC<VectorIconProps> = ({
  size,
  width = ${doc.canvas.width},
  height = ${doc.canvas.height},
  style,
}) => {
  const actualWidth = size || width;
  const actualHeight = size || height;

  return (
    <View style={[styles.container, style]}>
      <Svg
        width={actualWidth}
        height={actualHeight}
        viewBox="0 0 ${doc.canvas.width} ${doc.canvas.height}"
      >
${elementsJsx}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ${doc.title.replace(/[^a-zA-Z0-9]/g, '') || 'VectorGraphic'};
`;
        return {
          data: code,
          filename: `${doc.title.toLowerCase().replace(/\s+/g, '_')}_native.tsx`,
        };
      },
    },
    {
      id: 'css-data-uri',
      name: 'CSS SVG Data-URI (.css)',
      fileExtension: 'css',
      mimeType: 'text/css',
      description: 'Exports the graphic encoded as a CSS background-image data URI.',
      export: async (doc) => {
        const svg = nodesToSvgString(doc.rootNodes, doc.canvas, { minify: true });
        const encoded = encodeURIComponent(svg);
        const css = `.vector-asset-${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')} {\n  background-image: url("data:image/svg+xml,${encoded}");\n  background-size: contain;\n  background-repeat: no-repeat;\n  width: ${doc.canvas.width}px;\n  height: ${doc.canvas.height}px;\n}\n`;
        return {
          data: css,
          filename: `${doc.title.toLowerCase().replace(/\s+/g, '_')}.css`,
        };
      },
    },
  ],
};

// Plugin 2: Generative Spiral & Rose Wave Tool
const spiralToolPlugin: VecturaPlugin = {
  id: 'generative-curves',
  name: 'Generative Curves & Spiral Tool',
  version: '1.0.0',
  author: 'Vectura Studio Core',
  description: 'Adds custom generative mathematical drawing tools for golden ratio logarithmic spirals and harmonic sine ribbons.',
  icon: 'Compass',
  enabled: true,
  tools: [
    {
      id: 'tool_spiral',
      name: 'Logarithmic Spiral',
      iconName: 'Sparkles',
      description: 'Click and drag on canvas to generate a mathematical Archimedean/Logarithmic golden spiral path.',
      onPointerDown: (point, ctx) => {
        const cx = point.x;
        const cy = point.y;
        const turns = 3.5;
        const pointsCount = 120;
        const a = 2;
        const b = 0.16;

        let d = '';
        for (let i = 0; i <= pointsCount; i++) {
          const theta = (i / pointsCount) * (turns * 2 * Math.PI);
          const r = a * Math.exp(b * theta) * 1.5;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);
          if (i === 0) {
            d += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
          } else {
            d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
          }
        }

        const spiralNode: SvgNode = {
          id: generateId('spiral'),
          type: 'path',
          name: 'Golden Spiral',
          attributes: {
            d,
            fill: 'none',
            stroke: '#06B6D4',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 1,
          },
          isVisible: true,
          isLocked: false,
        };

        ctx.addNode(spiralNode, 'Draw Logarithmic Spiral');
        ctx.notify('Generated Logarithmic Spiral path', 'success');
      },
    },
    {
      id: 'tool_sine_wave',
      name: 'Harmonic Sine Ribbon',
      iconName: 'Activity',
      description: 'Generates mathematical sine waves with controllable frequency and amplitude.',
      onPointerDown: (point, ctx) => {
        const startX = Math.max(20, point.x - 200);
        const startY = point.y;
        const length = 400;
        const amplitude = 40;
        const frequency = 4;

        let d = `M ${startX} ${startY}`;
        const step = 8;
        for (let x = 0; x <= length; x += step) {
          const y = startY + Math.sin((x / length) * Math.PI * 2 * frequency) * amplitude;
          d += ` L ${(startX + x).toFixed(2)} ${y.toFixed(2)}`;
        }

        const waveNode: SvgNode = {
          id: generateId('wave'),
          type: 'path',
          name: 'Sine Wave Ribbon',
          attributes: {
            d,
            fill: 'none',
            stroke: '#A855F7',
            strokeWidth: 3,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            opacity: 1,
          },
          isVisible: true,
          isLocked: false,
        };

        ctx.addNode(waveNode, 'Draw Sine Wave');
        ctx.notify('Generated Sine Wave Ribbon path', 'success');
      },
    },
  ],
};

// Plugin 3: Cyber Glow & Filter FX
const cyberGlowPlugin: VecturaPlugin = {
  id: 'cyber-glow-filters',
  name: 'Cyber Glow & Lighting FX',
  version: '1.1.0',
  author: 'Vectura Studio Core',
  description: 'Applies dynamic neon glow filters, drop shadows, and futuristic luminescence to selected vectors.',
  icon: 'Zap',
  enabled: true,
  effects: [
    {
      id: 'neon_glow',
      name: 'Cyber Neon Glow',
      description: 'Wraps element in a multi-stage glowing aura with intense specular center.',
      category: 'filter',
      parameters: [
        {
          id: 'glowColor',
          name: 'Glow Color',
          type: 'color',
          defaultValue: '#00F0FF',
        },
        {
          id: 'blurRadius',
          name: 'Glow Radius',
          type: 'number',
          defaultValue: 8,
          min: 1,
          max: 30,
          step: 1,
        },
      ],
      apply: (node, params, ctx) => {
        const glowColor = params.glowColor || '#00F0FF';
        const blurRadius = params.blurRadius || 8;
        const filterId = `filter_glow_${Math.random().toString(36).substring(2, 7)}`;

        const updatedAttrs = {
          ...node.attributes,
          stroke: node.attributes.stroke && node.attributes.stroke !== 'none' ? glowColor : node.attributes.stroke,
          filter: `drop-shadow(0 0 ${blurRadius}px ${glowColor}) drop-shadow(0 0 ${blurRadius * 2}px ${glowColor})`,
        };

        const updated = {
          ...node,
          attributes: updatedAttrs,
        };

        ctx.notify(`Applied Cyber Neon Glow to ${node.name}`, 'success');
        return updated;
      },
    },
    {
      id: 'invert_colors',
      name: 'Color Inversion',
      description: 'Inverts the fill and stroke chromatic values of the selected vector.',
      category: 'color',
      parameters: [],
      apply: (node, _params, ctx) => {
        function invertHex(hex?: string): string {
          if (!hex || hex === 'none' || !hex.startsWith('#')) return hex || 'none';
          const num = parseInt(hex.replace('#', ''), 16);
          const inverted = 0xffffff ^ num;
          return '#' + inverted.toString(16).padStart(6, '0');
        }

        const updatedAttrs = {
          ...node.attributes,
          fill: invertHex(node.attributes.fill),
          stroke: invertHex(node.attributes.stroke),
        };

        ctx.notify(`Inverted colors for ${node.name}`, 'info');
        return { ...node, attributes: updatedAttrs };
      },
    },
  ],
};

// Plugin 4: Path Roughen & Hand-Drawn Sketch FX
const sketchFXPlugin: VecturaPlugin = {
  id: 'sketch-hand-drawn',
  name: 'Hand-Drawn Sketch & Roughen',
  version: '1.0.0',
  author: 'Vectura Studio Core',
  description: 'Perturbs vector paths with organic hand-drawn jitter to simulate architectural sketch drafting.',
  icon: 'Feather',
  enabled: true,
  effects: [
    {
      id: 'roughen_sketch',
      name: 'Organic Path Jitter',
      description: 'Adds organic displacement variance along path anchors.',
      category: 'distortion',
      parameters: [
        {
          id: 'roughness',
          name: 'Displacement (px)',
          type: 'number',
          defaultValue: 4,
          min: 1,
          max: 20,
          step: 0.5,
        },
      ],
      apply: (node, params, ctx) => {
        const roughness = params.roughness || 4;
        const currentD = node.attributes.d;
        if (!currentD) {
          ctx.notify('Selected node is not a path with "d" attribute', 'warning');
          return node;
        }

        // Perturb numbers in path commands
        const jitteredD = currentD.replace(/(-?\d+(\.\d+)?)/g, (match) => {
          const val = parseFloat(match);
          const delta = (Math.random() - 0.5) * roughness * 2;
          return (val + delta).toFixed(2);
        });

        const updatedNode: SvgNode = {
          ...node,
          attributes: {
            ...node.attributes,
            d: jitteredD,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        };

        ctx.notify(`Applied Organic Jitter to ${node.name}`, 'success');
        return updatedNode;
      },
    },
  ],
};

// Master Plugin Registry
export class PluginRegistry {
  private plugins: Map<string, VecturaPlugin> = new Map();

  constructor() {
    this.register(reactNativeExporterPlugin);
    this.register(spiralToolPlugin);
    this.register(cyberGlowPlugin);
    this.register(sketchFXPlugin);
  }

  public register(plugin: VecturaPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public unregister(id: string): void {
    this.plugins.delete(id);
  }

  public togglePlugin(id: string, enabled?: boolean): void {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.enabled = enabled !== undefined ? enabled : !plugin.enabled;
    }
  }

  public getAllPlugins(): VecturaPlugin[] {
    return Array.from(this.plugins.values());
  }

  public getActiveTools(): PluginTool[] {
    const tools: PluginTool[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.tools) {
        tools.push(...plugin.tools);
      }
    }
    return tools;
  }

  public getActiveEffects(): PluginEffect[] {
    const effects: PluginEffect[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.effects) {
        effects.push(...plugin.effects);
      }
    }
    return effects;
  }

  public getActiveExporters(): PluginExporter[] {
    const exporters: PluginExporter[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && plugin.exporters) {
        exporters.push(...plugin.exporters);
      }
    }
    return exporters;
  }
}

export const defaultPluginRegistry = new PluginRegistry();
