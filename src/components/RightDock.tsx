import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCw, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Maximize, 
  Layers, 
  Zap, 
  Sparkles, 
  Palette, 
  FileText,
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { SvgNode, CanvasSettings } from '../types/editor';
import { PluginEffect, PluginContext } from '../types/plugin';

interface RightDockProps {
  selectedNode: SvgNode | null;
  onUpdateSelected: (updates: Partial<SvgNode['attributes']>, actionDescription?: string) => void;
  canvasSettings: CanvasSettings;
  setCanvasSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  pluginEffects: PluginEffect[];
  pluginContext: PluginContext;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

const COLOR_PRESETS = [
  '#6366F1', '#4F46E5', '#06B6D4', '#0EA5E9', '#10B981', 
  '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#F8FAFC', 
  '#94A3B8', '#334155', '#1E293B', '#0F172A', 'none'
];

export const RightDock: React.FC<RightDockProps> = ({
  selectedNode,
  onUpdateSelected,
  canvasSettings,
  setCanvasSettings,
  pluginEffects,
  pluginContext,
  onAlign,
}) => {
  const [aspectLocked, setAspectLocked] = useState(false);
  const [selectedEffectId, setSelectedEffectId] = useState<string>('');
  const [effectParams, setEffectParams] = useState<Record<string, any>>({});

  const attrs = selectedNode?.attributes || {};

  const handleAttrChange = (key: keyof SvgNode['attributes'], value: any, actionDesc = 'Update Property') => {
    onUpdateSelected({ [key]: value }, actionDesc);
  };

  const handleDimensionChange = (key: 'width' | 'height', val: number) => {
    if (aspectLocked && attrs.width && attrs.height) {
      const ratio = attrs.width / attrs.height;
      if (key === 'width') {
        onUpdateSelected({ width: val, height: Math.round(val / ratio) }, 'Resize Proportional');
      } else {
        onUpdateSelected({ height: val, width: Math.round(val * ratio) }, 'Resize Proportional');
      }
    } else {
      onUpdateSelected({ [key]: val }, `Change ${key}`);
    }
  };

  const handleApplyEffect = (effect: PluginEffect) => {
    if (!selectedNode) return;
    const defaultParams: Record<string, any> = {};
    effect.parameters.forEach(p => {
      defaultParams[p.id] = effectParams[p.id] !== undefined ? effectParams[p.id] : p.defaultValue;
    });

    const result = effect.apply(selectedNode, defaultParams, pluginContext);
    if (!Array.isArray(result)) {
      onUpdateSelected(result.attributes, `Apply ${effect.name}`);
    }
  };

  return (
    <aside className="w-72 bg-[#0E1522] border-l border-[#1E293B] flex flex-col h-full shrink-0 select-none overflow-y-auto text-xs z-20">
      {selectedNode ? (
        <div className="p-3 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-100">Properties Inspector</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
              {selectedNode.type.toUpperCase()}
            </span>
          </div>

          {/* Alignment Toolbar */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Alignment
            </span>
            <div className="grid grid-cols-6 gap-1 bg-slate-900/60 p-1 rounded border border-slate-800 text-slate-400">
              <button
                onClick={() => onAlign('left')}
                title="Align Left"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('center')}
                title="Align Horizontal Center"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('right')}
                title="Align Right"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('top')}
                title="Align Top"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <Maximize className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                onClick={() => onAlign('middle')}
                title="Align Vertical Middle"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <AlignJustify className="w-3.5 h-3.5 rotate-90" />
              </button>
              <button
                onClick={() => onAlign('bottom')}
                title="Align Bottom"
                className="p-1 rounded hover:bg-slate-800 hover:text-white flex justify-center"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Transform & Dimensions */}
          <div className="flex flex-col gap-2 border-b border-[#1E293B] pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Transform & Bounds
              </span>
              <button
                onClick={() => setAspectLocked(!aspectLocked)}
                title={aspectLocked ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                className="text-slate-400 hover:text-white p-0.5"
              >
                {aspectLocked ? <Lock className="w-3 h-3 text-indigo-400" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">X</span>
                <input
                  type="number"
                  value={attrs.x !== undefined ? Math.round(attrs.x) : attrs.cx !== undefined ? Math.round(attrs.cx) : 0}
                  onChange={(e) => handleAttrChange(attrs.cx !== undefined ? 'cx' : 'x', Number(e.target.value), 'Change X Position')}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Y</span>
                <input
                  type="number"
                  value={attrs.y !== undefined ? Math.round(attrs.y) : attrs.cy !== undefined ? Math.round(attrs.cy) : 0}
                  onChange={(e) => handleAttrChange(attrs.cy !== undefined ? 'cy' : 'y', Number(e.target.value), 'Change Y Position')}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">W</span>
                <input
                  type="number"
                  value={attrs.width !== undefined ? Math.round(attrs.width) : attrs.r ? Math.round(attrs.r * 2) : 100}
                  onChange={(e) => handleDimensionChange('width', Math.max(1, Number(e.target.value)))}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">H</span>
                <input
                  type="number"
                  value={attrs.height !== undefined ? Math.round(attrs.height) : attrs.r ? Math.round(attrs.r * 2) : 100}
                  onChange={(e) => handleDimensionChange('height', Math.max(1, Number(e.target.value)))}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">∠</span>
                <input
                  type="number"
                  value={attrs.rotation || 0}
                  onChange={(e) => handleAttrChange('rotation', Number(e.target.value), 'Rotate Element')}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
                <span className="text-slate-500 text-[10px]">°</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">Op</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((attrs.opacity !== undefined ? attrs.opacity : 1) * 100)}
                  onChange={(e) => handleAttrChange('opacity', Math.max(0, Math.min(100, Number(e.target.value))) / 100, 'Change Opacity')}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
                <span className="text-slate-500 text-[10px]">%</span>
              </div>
            </div>
          </div>

          {/* Fill Appearance */}
          <div className="flex flex-col gap-2 border-b border-[#1E293B] pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Fill Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={attrs.fill && attrs.fill !== 'none' ? attrs.fill : '#6366F1'}
                onChange={(e) => handleAttrChange('fill', e.target.value, 'Change Fill Color')}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={attrs.fill || 'none'}
                onChange={(e) => handleAttrChange('fill', e.target.value, 'Change Fill Color')}
                className="bg-slate-900 text-slate-200 font-mono px-2 py-1 rounded border border-slate-800 flex-1 text-xs focus:outline-none"
              />
              <button
                onClick={() => handleAttrChange('fill', attrs.fill === 'none' ? '#6366F1' : 'none', 'Toggle Transparent Fill')}
                className={`px-2 py-1 rounded border text-[10px] font-medium transition-colors ${
                  attrs.fill === 'none' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                None
              </button>
            </div>

            {/* Quick Palette Swatches */}
            <div className="flex flex-wrap gap-1 mt-1">
              {COLOR_PRESETS.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAttrChange('fill', color, 'Change Fill Color')}
                  title={color}
                  className="w-4 h-4 rounded-full border border-slate-700 hover:scale-125 transition-transform"
                  style={{ backgroundColor: color === 'none' ? '#1E293B' : color }}
                />
              ))}
            </div>
          </div>

          {/* Stroke Appearance */}
          <div className="flex flex-col gap-2 border-b border-[#1E293B] pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Stroke & Border
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={attrs.stroke && attrs.stroke !== 'none' ? attrs.stroke : '#06B6D4'}
                onChange={(e) => handleAttrChange('stroke', e.target.value, 'Change Stroke Color')}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={attrs.stroke || 'none'}
                onChange={(e) => handleAttrChange('stroke', e.target.value, 'Change Stroke Color')}
                className="bg-slate-900 text-slate-200 font-mono px-2 py-1 rounded border border-slate-800 flex-1 text-xs focus:outline-none"
              />
              <button
                onClick={() => handleAttrChange('stroke', attrs.stroke === 'none' ? '#06B6D4' : 'none', 'Toggle Stroke')}
                className={`px-2 py-1 rounded border text-[10px] font-medium transition-colors ${
                  attrs.stroke === 'none' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                None
              </button>
            </div>

            {/* Stroke Width & Caps */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">Width</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={attrs.strokeWidth !== undefined ? attrs.strokeWidth : 1}
                  onChange={(e) => handleAttrChange('strokeWidth', Math.max(0, Number(e.target.value)), 'Change Stroke Width')}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right font-mono text-xs"
                />
              </div>

              <select
                value={attrs.strokeLinecap || 'round'}
                onChange={(e) => handleAttrChange('strokeLinecap', e.target.value as any, 'Change Stroke Cap')}
                className="bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-800 focus:outline-none text-xs"
              >
                <option value="butt">Butt Cap</option>
                <option value="round">Round Cap</option>
                <option value="square">Square Cap</option>
              </select>
            </div>

            {/* Dash Array */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-500 text-[10px]">Dash</span>
              <input
                type="text"
                placeholder="e.g. 4 8 or 6 4"
                value={attrs.strokeDasharray || ''}
                onChange={(e) => handleAttrChange('strokeDasharray', e.target.value, 'Change Dash Array')}
                className="bg-transparent text-slate-200 w-full focus:outline-none text-right font-mono text-xs"
              />
            </div>
          </div>

          {/* Text Properties (if node is text) */}
          {selectedNode.type === 'text' && (
            <div className="flex flex-col gap-2 border-b border-[#1E293B] pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Text Properties
              </span>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={attrs.textContent || ''}
                  onChange={(e) => handleAttrChange('textContent', e.target.value, 'Change Text Content')}
                  className="bg-slate-900 text-slate-100 px-2 py-1 rounded border border-slate-800 text-xs focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Size</span>
                    <input
                      type="number"
                      value={attrs.fontSize || 16}
                      onChange={(e) => handleAttrChange('fontSize', Number(e.target.value), 'Change Font Size')}
                      className="bg-transparent text-slate-200 w-full focus:outline-none text-right text-xs"
                    />
                  </div>
                  <select
                    value={attrs.fontWeight || 'normal'}
                    onChange={(e) => handleAttrChange('fontWeight', e.target.value, 'Change Font Weight')}
                    className="bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-800 focus:outline-none text-xs"
                  >
                    <option value="normal">Regular 400</option>
                    <option value="600">SemiBold 600</option>
                    <option value="bold">Bold 700</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Plugin Effects Section */}
          {pluginEffects.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                <Sparkles className="w-3 h-3" />
                <span>Plugin Effects</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {pluginEffects.map(effect => (
                  <div key={effect.id} className="bg-slate-900/80 p-2 rounded border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{effect.name}</span>
                      <button
                        onClick={() => handleApplyEffect(effect)}
                        className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white transition-colors text-[10px] font-medium"
                      >
                        Apply
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">{effect.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Document Settings View */
        <div className="p-3 flex flex-col gap-4">
          <div className="flex items-center gap-1.5 border-b border-[#1E293B] pb-2">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-100">Canvas & Artboard</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Canvas Dimensions
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">W</span>
                <input
                  type="number"
                  value={canvasSettings.width}
                  onChange={(e) => setCanvasSettings(prev => ({ ...prev, width: Math.max(100, Number(e.target.value)) }))}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-500 text-[11px]">H</span>
                <input
                  type="number"
                  value={canvasSettings.height}
                  onChange={(e) => setCanvasSettings(prev => ({ ...prev, height: Math.max(100, Number(e.target.value)) }))}
                  className="bg-transparent text-slate-200 w-full focus:outline-none text-right tabular-nums text-xs"
                />
              </div>
            </div>

            {/* Dimension Presets */}
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                onClick={() => setCanvasSettings(prev => ({ ...prev, width: 800, height: 600 }))}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
              >
                Studio (800×600)
              </button>
              <button
                onClick={() => setCanvasSettings(prev => ({ ...prev, width: 1080, height: 1080 }))}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
              >
                Square (1080×1080)
              </button>
              <button
                onClick={() => setCanvasSettings(prev => ({ ...prev, width: 512, height: 512 }))}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
              >
                App Icon (512×512)
              </button>
              <button
                onClick={() => setCanvasSettings(prev => ({ ...prev, width: 1920, height: 1080 }))}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
              >
                Full HD (1920×1080)
              </button>
            </div>
          </div>

          {/* Background Color */}
          <div className="flex flex-col gap-2 border-b border-[#1E293B] pb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Artboard Background
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={canvasSettings.background.startsWith('#') ? canvasSettings.background : '#0B0F17'}
                onChange={(e) => setCanvasSettings(prev => ({ ...prev, background: e.target.value }))}
                className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={canvasSettings.background}
                onChange={(e) => setCanvasSettings(prev => ({ ...prev, background: e.target.value }))}
                className="bg-slate-900 text-slate-200 font-mono px-2 py-1 rounded border border-slate-800 flex-1 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            Select any vector element on the canvas or layer tree to edit its properties, transforms, bezier anchors, and effects.
          </div>
        </div>
      )}
    </aside>
  );
};
