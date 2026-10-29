export type SvgElementType = 
  | 'path' 
  | 'rect' 
  | 'circle' 
  | 'ellipse' 
  | 'polygon' 
  | 'line' 
  | 'text' 
  | 'g';

export type ToolType = 
  | 'select' 
  | 'node' 
  | 'pen' 
  | 'rect' 
  | 'circle' 
  | 'polygon' 
  | 'star' 
  | 'line' 
  | 'text' 
  | 'eyedropper';

export interface Point {
  x: number;
  y: number;
}

export interface PathNodePoint {
  id: string;
  x: number;
  y: number;
  handleIn?: Point;
  handleOut?: Point;
  type: 'corner' | 'smooth' | 'symmetric';
  command: 'M' | 'L' | 'C' | 'Q' | 'Z';
}

export interface SvgElementAttributes {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: string;
  d?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  opacity?: number;
  transform?: string;
  rotation?: number; // In degrees
  scaleX?: number;
  scaleY?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  textContent?: string;
  filter?: string;
  className?: string;
}

export interface SvgNode {
  id: string;
  type: SvgElementType;
  name: string;
  attributes: SvgElementAttributes;
  children?: SvgNode[];
  isLocked?: boolean;
  isVisible?: boolean;
}

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce';

export interface Keyframe {
  id: string;
  elementId: string;
  property: 'x' | 'y' | 'width' | 'height' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity' | 'fill' | 'stroke' | 'strokeWidth' | 'd';
  timeMs: number;
  value: number | string;
  easing: EasingType;
}

export interface AnimationTimeline {
  durationMs: number;
  currentTimeMs: number;
  fps: number;
  isPlaying: boolean;
  isLooping: boolean;
  keyframes: Keyframe[];
}

export type ViewMode = 'canvas' | 'split' | 'code';

export type PlatformPreset = 'web' | 'macos' | 'windows' | 'linux' | 'android' | 'ios';

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasSettings {
  width: number;
  height: number;
  background: string;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
}

export interface ProjectDocument {
  id: string;
  title: string;
  version: string;
  canvas: CanvasSettings;
  rootNodes: SvgNode[];
  animation: AnimationTimeline;
  createdAt: string;
  updatedAt: string;
}
