import { SvgNode, Point, ProjectDocument, CanvasSettings } from './editor';

export interface PluginContext {
  document: ProjectDocument;
  selectedNodeIds: string[];
  setNodes: (nodes: SvgNode[], actionDescription?: string) => void;
  updateNode: (id: string, updates: Partial<SvgNode>, actionDescription?: string) => void;
  addNode: (node: SvgNode, actionDescription?: string) => void;
  deleteSelectedNodes: () => void;
  canvas: CanvasSettings;
  notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface PluginTool {
  id: string;
  name: string;
  iconName: string;
  cursor?: string;
  description: string;
  onPointerDown?: (point: Point, ctx: PluginContext) => void;
  onPointerMove?: (point: Point, ctx: PluginContext) => void;
  onPointerUp?: (point: Point, ctx: PluginContext) => void;
}

export interface PluginEffectParameter {
  id: string;
  name: string;
  type: 'number' | 'color' | 'select' | 'boolean';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface PluginEffect {
  id: string;
  name: string;
  description: string;
  category: 'filter' | 'distortion' | 'color' | 'geometry';
  parameters: PluginEffectParameter[];
  apply: (node: SvgNode, params: Record<string, any>, ctx: PluginContext) => SvgNode | SvgNode[];
}

export interface PluginExporter {
  id: string;
  name: string;
  fileExtension: string;
  mimeType: string;
  description: string;
  export: (doc: ProjectDocument) => Promise<{ data: string | Blob; filename: string }>;
}

export interface PluginMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  execute: (ctx: PluginContext) => void;
}

export interface VecturaPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  enabled: boolean;
  tools?: PluginTool[];
  effects?: PluginEffect[];
  exporters?: PluginExporter[];
  menuItems?: PluginMenuItem[];
}
