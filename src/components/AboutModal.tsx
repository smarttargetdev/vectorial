import React from 'react';
import { 
  X, 
  Layers, 
  Cpu, 
  Sparkles, 
  Code2, 
  Monitor, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Heart,
  Zap
} from 'lucide-react';
import { documentationData } from '../docs/documentationData';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDocs: (tab: 'documentation' | 'architecture' | 'components') => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenDocs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0E1522] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-br from-indigo-950/60 via-[#0E1522] to-[#0A0F1A] border-b border-[#1E293B] flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Vector Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]">
                  v{documentationData.version}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Cross-Platform Vector Illustration & Motion Graphics Suite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {/* Release & Engine Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 uppercase text-[9px] font-mono">Build Codename</span>
              <span className="font-semibold text-cyan-400">{documentationData.releaseCodename}</span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
              <span className="text-slate-500 uppercase text-[9px] font-mono">AI Reasoning Core</span>
              <span className="font-semibold text-indigo-400">Gemini 3.8 Flash (High Thinking)</span>
            </div>
          </div>

          {/* Architecture Highlights */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Core Capabilities
            </span>
            <div className="space-y-1.5 text-slate-300 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Single shared codebase for Web, macOS, Windows, Linux, iOS, and Android.</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Deterministic Virtual SVG AST with instant bidirectional XML synchronization.</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Direct Bezier node editing with live anchor vertex and tangent handle manipulation.</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Multi-track keyframe motion timeline with 60 FPS playback and standalone animated SVG export.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Extensible plugin system supporting custom tools, filter shaders, and React Native exporters.</span>
              </div>
            </div>
          </div>

          {/* Documentation Quick Links */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#1E293B]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Included Technical Documentation
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { onClose(); onOpenDocs('documentation'); }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors"
              >
                <div className="font-semibold text-slate-200">User Guide</div>
                <div className="text-[10px] text-slate-500">Documentation.md</div>
              </button>
              <button
                onClick={() => { onClose(); onOpenDocs('architecture'); }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors"
              >
                <div className="font-semibold text-slate-200">Architecture</div>
                <div className="text-[10px] text-slate-500">Architecture.md</div>
              </button>
              <button
                onClick={() => { onClose(); onOpenDocs('components'); }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center hover:border-indigo-500/50 transition-colors"
              >
                <div className="font-semibold text-slate-200">Components</div>
                <div className="text-[10px] text-slate-500">Components.md</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">
            © Vector Studio · Open Vector Standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
