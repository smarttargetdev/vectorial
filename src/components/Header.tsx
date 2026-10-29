import React, { useState } from 'react';
import { 
  FolderOpen, 
  Save, 
  FileCode, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Download, 
  Monitor, 
  Smartphone, 
  Layers, 
  Puzzle, 
  Eye, 
  Plus, 
  Copy, 
  Trash2,
  Columns,
  Code2,
  HelpCircle,
  Info,
  BookOpen,
  Cpu
} from 'lucide-react';
import { ViewMode, PlatformPreset, ProjectDocument } from '../types/editor';
import { sampleCyberEmblem, sampleSolarOrbit } from '../utils/sampleDocuments';

interface HeaderProps {
  document: ProjectDocument;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  platform: PlatformPreset;
  setPlatform: (p: PlatformPreset) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoAction: string | null;
  redoAction: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onNewDocument: () => void;
  onOpenSvgFile: (file: File) => void;
  onSaveProject: () => void;
  onLoadSample: (doc: ProjectDocument) => void;
  onOpenExportModal: () => void;
  onOpenAiModal: () => void;
  onOpenPluginModal: () => void;
  onOpenHelpDoc: (tab: 'documentation' | 'architecture' | 'components') => void;
  onOpenAbout: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  document,
  viewMode,
  setViewMode,
  platform,
  setPlatform,
  canUndo,
  canRedo,
  undoAction,
  redoAction,
  onUndo,
  onRedo,
  onNewDocument,
  onOpenSvgFile,
  onSaveProject,
  onLoadSample,
  onOpenExportModal,
  onOpenAiModal,
  onOpenPluginModal,
  onOpenHelpDoc,
  onOpenAbout,
  onDeleteSelected,
  onDuplicateSelected,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenSvgFile(e.target.files[0]);
    }
  };

  return (
    <header className="h-12 bg-[#0E1522] border-b border-[#1E293B] px-4 flex items-center justify-between gap-4 text-xs select-none z-30 shrink-0">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".svg,.xml"
        className="hidden"
      />

      {/* Left Zone: Brand Wordmark & Document Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-500/20 text-xs">
            V
          </div>
          <span className="font-bold tracking-tight text-slate-100 text-sm whitespace-nowrap">
            Vector Studio
          </span>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Dropdown Menus */}
        <div className="flex items-center gap-1 text-slate-300">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${activeMenu === 'file' ? 'bg-slate-800 text-white' : ''}`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#131B2E] border border-slate-700/80 rounded-lg shadow-2xl py-1 z-50">
                  <button
                    onClick={() => { onNewDocument(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Document</span>
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open SVG File...</span>
                  </button>
                  <button
                    onClick={() => { onSaveProject(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Project (.vectura)</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500">
                    Sample Projects
                  </div>
                  <button
                    onClick={() => { onLoadSample(sampleCyberEmblem); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cyber Pulse Emblem</span>
                  </button>
                  <button
                    onClick={() => { onLoadSample(sampleSolarOrbit); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Solar Orbit Motion</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors ${activeMenu === 'edit' ? 'bg-slate-800 text-white' : ''}`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                <div className="absolute top-full left-0 mt-1 w-52 bg-[#131B2E] border border-slate-700/80 rounded-lg shadow-2xl py-1 z-50">
                  <button
                    disabled={!canUndo}
                    onClick={() => { onUndo(); setActiveMenu(null); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${canUndo ? 'hover:bg-indigo-600/20 hover:text-indigo-300' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Ctrl+Z</span>
                  </button>
                  <button
                    disabled={!canRedo}
                    onClick={() => { onRedo(); setActiveMenu(null); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${canRedo ? 'hover:bg-indigo-600/20 hover:text-indigo-300' : 'opacity-40 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Redo2 className="w-3.5 h-3.5" />
                      <span>Redo</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Ctrl+Y</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={() => { onDuplicateSelected(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Ctrl+D</span>
                  </button>
                  <button
                    onClick={() => { onDeleteSelected(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Del</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Plugins Menu */}
          <button
            onClick={onOpenPluginModal}
            className="px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5 text-slate-300"
          >
            <Puzzle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Plugins</span>
          </button>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5 ${activeMenu === 'help' ? 'bg-slate-800 text-white' : 'text-slate-300'}`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Help</span>
            </button>
            {activeMenu === 'help' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#131B2E] border border-slate-700/80 rounded-lg shadow-2xl py-1 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 font-mono">
                    Technical Documents
                  </div>
                  <button
                    onClick={() => { onOpenHelpDoc('documentation'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Documentation & Manual</span>
                  </button>
                  <button
                    onClick={() => { onOpenHelpDoc('architecture'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Architecture Design</span>
                  </button>
                  <button
                    onClick={() => { onOpenHelpDoc('components'); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Components Reference</span>
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    onClick={() => { onOpenAbout(); setActiveMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>About Vector Studio</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Undo / Redo Quick Buttons with Action Tooltips */}
        <div className="flex items-center gap-0.5 bg-slate-900/80 p-0.5 rounded border border-slate-800">
          <button
            disabled={!canUndo}
            onClick={onUndo}
            title={undoAction ? `Undo: ${undoAction} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
            className={`p-1.5 rounded transition-colors ${canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!canRedo}
            onClick={onRedo}
            title={redoAction ? `Redo: ${redoAction} (Ctrl+Y)` : 'Redo (Ctrl+Y)'}
            className={`p-1.5 rounded transition-colors ${canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Zone: Workspace View Mode & Platform Preset Switcher */}
      <div className="hidden md:flex items-center gap-4">
        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-0.5 bg-[#080C14] p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('canvas')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'canvas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split XML</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>XML Source</span>
          </button>
        </div>

        {/* Platform Viewport Preset Simulator */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
          <span className="text-slate-500 font-mono">Platform:</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as PlatformPreset)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="web" className="bg-[#131B2E] text-slate-200">Web / Universal</option>
            <option value="macos" className="bg-[#131B2E] text-slate-200">macOS Desktop</option>
            <option value="windows" className="bg-[#131B2E] text-slate-200">Windows Desktop</option>
            <option value="linux" className="bg-[#131B2E] text-slate-200">Linux Desktop</option>
            <option value="ios" className="bg-[#131B2E] text-slate-200">iOS (iPhone/iPad)</option>
            <option value="android" className="bg-[#131B2E] text-slate-200">Android Mobile</option>
          </select>
        </div>
      </div>

      {/* Right Zone: Primary Actions (AI Assistant + Export) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenAiModal}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 transition-all flex items-center gap-1.5 font-medium shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>AI Vector Studio</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
