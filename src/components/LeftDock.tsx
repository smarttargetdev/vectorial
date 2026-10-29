import React, { useState } from 'react';
import { 
  MousePointer, 
  GitCommit, 
  PenTool, 
  Square, 
  Circle, 
  Hexagon, 
  Star, 
  Minus, 
  Type, 
  Pipette, 
  FolderPlus, 
  FolderMinus, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Layers, 
  Search,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Activity
} from 'lucide-react';
import { SvgNode, ToolType } from '../types/editor';
import { PluginTool } from '../types/plugin';

interface LeftDockProps {
  activeTool: ToolType | string;
  setActiveTool: (tool: ToolType | string) => void;
  pluginTools: PluginTool[];
  nodes: SvgNode[];
  selectedNodeIds: string[];
  onSelectNode: (id: string, multi?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRenameNode: (id: string, newName: string) => void;
  onDeleteNode: (id: string) => void;
  onMoveNodeDepth: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  onGroupSelected: () => void;
  onUngroupSelected: () => void;
}

export const LeftDock: React.FC<LeftDockProps> = ({
  activeTool,
  setActiveTool,
  pluginTools,
  nodes,
  selectedNodeIds,
  onSelectNode,
  onToggleVisibility,
  onToggleLock,
  onRenameNode,
  onDeleteNode,
  onMoveNodeDepth,
  onGroupSelected,
  onUngroupSelected,
}) => {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartRename = (node: SvgNode) => {
    setEditingNodeId(node.id);
    setEditingName(node.name);
  };

  const handleFinishRename = () => {
    if (editingNodeId && editingName.trim()) {
      onRenameNode(editingNodeId, editingName.trim());
    }
    setEditingNodeId(null);
  };

  // Render individual layer tree node recursively
  const renderLayerNode = (node: SvgNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeIds.includes(node.id);
    const isGroup = node.type === 'g' || (node.children && node.children.length > 0);
    const isCollapsed = collapsedGroupIds.has(node.id);

    // Search query filter
    if (searchQuery.trim() && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      if (!isGroup) return null;
    }

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={(e) => onSelectNode(node.id, e.shiftKey || e.metaKey || e.ctrlKey)}
          className={`group flex items-center justify-between px-2 py-1 text-xs transition-colors cursor-pointer border-l-2 ${
            isSelected 
              ? 'bg-indigo-600/20 text-white border-indigo-500 font-medium' 
              : 'text-slate-300 hover:bg-slate-800/70 border-transparent'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
            {isGroup ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(node.id); }}
                className="p-0.5 text-slate-400 hover:text-white"
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-3" />
            )}

            {/* Type Icon */}
            <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
              {node.type}
            </span>

            {/* Layer Name / Rename input */}
            {editingNodeId === node.id ? (
              <input
                type="text"
                value={editingName}
                autoFocus
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                className="bg-slate-900 text-white px-1 py-0.5 rounded border border-indigo-500 text-xs w-full focus:outline-none"
              />
            ) : (
              <span
                onDoubleClick={() => handleStartRename(node)}
                className="truncate cursor-text select-text"
                title="Double click to rename"
              >
                {node.name}
              </span>
            )}
          </div>

          {/* Quick Visibility & Lock Controls */}
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(node.id); }}
              title={node.isVisible === false ? 'Show layer' : 'Hide layer'}
              className="p-1 hover:text-white"
            >
              {node.isVisible === false ? (
                <EyeOff className="w-3 h-3 text-slate-500" />
              ) : (
                <Eye className="w-3 h-3 text-slate-400" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock(node.id); }}
              title={node.isLocked ? 'Unlock layer' : 'Lock layer'}
              className="p-1 hover:text-white"
            >
              {node.isLocked ? (
                <Lock className="w-3 h-3 text-amber-400" />
              ) : (
                <Unlock className="w-3 h-3 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Children if group */}
        {isGroup && !isCollapsed && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderLayerNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const primarySelectedId = selectedNodeIds[0];

  return (
    <aside className="w-64 bg-[#0E1522] border-r border-[#1E293B] flex flex-col h-full shrink-0 select-none z-20">
      {/* Tool Palette Rack */}
      <div className="p-2 border-b border-[#1E293B] bg-[#0A0F1A]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
          Vector Tools
        </div>
        <div className="grid grid-cols-5 gap-1">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Transform (V)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'select' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Select</span>
          </button>

          {/* Node Edit Tool */}
          <button
            onClick={() => setActiveTool('node')}
            title="Direct Node & Bezier Edit (A)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'node' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Nodes</span>
          </button>

          {/* Pen Tool */}
          <button
            onClick={() => setActiveTool('pen')}
            title="Pen / Path Tool (P)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'pen' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Pen</span>
          </button>

          {/* Rectangle Tool */}
          <button
            onClick={() => setActiveTool('rect')}
            title="Rectangle (R)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'rect' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Rect</span>
          </button>

          {/* Circle Tool */}
          <button
            onClick={() => setActiveTool('circle')}
            title="Circle / Ellipse (O)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'circle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Circle className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Circle</span>
          </button>

          {/* Polygon / Hexagon */}
          <button
            onClick={() => setActiveTool('polygon')}
            title="Polygon"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'polygon' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Hexagon className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Poly</span>
          </button>

          {/* Star Tool */}
          <button
            onClick={() => setActiveTool('star')}
            title="Star Geometric Shape"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'star' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Star</span>
          </button>

          {/* Line Tool */}
          <button
            onClick={() => setActiveTool('line')}
            title="Line Segment (L)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Line</span>
          </button>

          {/* Text Tool */}
          <button
            onClick={() => setActiveTool('text')}
            title="SVG Text Label (T)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Text</span>
          </button>

          {/* Eyedropper Tool */}
          <button
            onClick={() => setActiveTool('eyedropper')}
            title="Eyedropper Color Picker (I)"
            className={`p-2 rounded flex flex-col items-center justify-center transition-all ${
              activeTool === 'eyedropper' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Pipette className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Picker</span>
          </button>
        </div>

        {/* Plugin Tools (if active) */}
        {pluginTools.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-indigo-400 mb-1 px-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Plugin Tools</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {pluginTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  title={tool.description}
                  className={`px-2 py-1.5 rounded flex items-center gap-1.5 text-xs transition-all ${
                    activeTool === tool.id ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span className="truncate">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Layer Tree Explorer Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Layer Header & Actions */}
        <div className="p-2 border-b border-[#1E293B] flex items-center justify-between gap-1 bg-[#0A0F1A]">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Document Layers</span>
            <span className="text-[10px] text-slate-500 font-mono">({nodes.length})</span>
          </div>

          {/* Layer Hierarchy Operations */}
          <div className="flex items-center gap-0.5 text-slate-400">
            <button
              onClick={onGroupSelected}
              disabled={selectedNodeIds.length < 2}
              title="Group selected (Ctrl+G)"
              className={`p-1 rounded ${selectedNodeIds.length >= 2 ? 'hover:bg-slate-800 hover:text-white' : 'opacity-30 cursor-not-allowed'}`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onUngroupSelected}
              disabled={selectedNodeIds.length === 0}
              title="Ungroup (Ctrl+Shift+G)"
              className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <FolderMinus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => primarySelectedId && onMoveNodeDepth(primarySelectedId, 'up')}
              disabled={!primarySelectedId}
              title="Move Up"
              className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => primarySelectedId && onMoveNodeDepth(primarySelectedId, 'down')}
              disabled={!primarySelectedId}
              title="Move Down"
              className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => primarySelectedId && onDeleteNode(primarySelectedId)}
              disabled={!primarySelectedId}
              title="Delete Layer"
              className="p-1 rounded hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Layers */}
        <div className="px-2 py-1.5 border-b border-[#1E293B]">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-xs">
            <Search className="w-3 h-3 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Filter layers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs"
            />
          </div>
        </div>

        {/* Layer Nodes List */}
        <div className="flex-1 overflow-y-auto py-1">
          {nodes.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Canvas is empty. Select a tool to start drawing.
            </div>
          ) : (
            nodes.map(node => renderLayerNode(node, 0))
          )}
        </div>
      </div>
    </aside>
  );
};
