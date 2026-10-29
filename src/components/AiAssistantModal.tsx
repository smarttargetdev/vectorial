import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Check, 
  Wand2, 
  Code, 
  Eye, 
  Layers, 
  Cpu, 
  Maximize2 
} from 'lucide-react';
import { SvgNode, CanvasSettings } from '../types/editor';
import { svgStringToNodes } from '../utils/svgParser';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSvgString: string;
  onInsertGeneratedNodes: (nodes: SvgNode[], actionDesc: string) => void;
  canvasSettings: CanvasSettings;
}

const INSPIRATION_PROMPTS = [
  'Futuristic cybernetic lion logo with sharp polygon geometry and electric cyan gradients',
  'Complex geometric mandala emblem with radial symmetry and golden accents',
  'Isometric floating server tower with circuit trace lines and neon pulse lights',
  'Modern abstract fluid wave emblem with smooth cubic bezier ribbon loops',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentSvgString,
  onInsertGeneratedNodes,
  canvasSettings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [mode, setMode] = useState<'create' | 'modify' | 'optimize'>('create');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() && mode !== 'optimize') return;
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'optimize') {
        const res = await fetch('/api/gemini/optimize-svg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ svgCode: currentSvgString }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Optimization failed');
        setGeneratedSvg(data.svg);
      } else {
        const res = await fetch('/api/gemini/generate-vector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            currentSvg: currentSvgString,
            action: mode,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');
        if (!data.svg) throw new Error('Model did not return valid SVG markup');
        setGeneratedSvg(data.svg);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!generatedSvg) return;
    try {
      const { nodes } = svgStringToNodes(generatedSvg);
      if (nodes.length > 0) {
        onInsertGeneratedNodes(nodes, `AI Vector: ${prompt.slice(0, 30) || 'Generated Artwork'}`);
        onClose();
      } else {
        setError('No valid vector nodes parsed from SVG output');
      }
    } catch (e: any) {
      setError('Failed to parse into editable vector nodes: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#0E1522] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0F1A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">Gemini 4 Vector Studio</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>Thinking: HIGH</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Generative vector synthesis, bezier path mathematics, and SVG optimization
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-800 w-fit">
            <button
              onClick={() => setMode('create')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'create' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generate New Artwork
            </button>
            <button
              onClick={() => setMode('modify')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'modify' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enhance Current Canvas
            </button>
            <button
              onClick={() => setMode('optimize')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === 'optimize' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Optimize & Clean SVG
            </button>
          </div>

          {/* Prompt Input */}
          {mode !== 'optimize' ? (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-slate-300">
                Vector Specification Prompt
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vector artwork with shapes, colors, gradients, and styling..."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
                />
              </div>

              {/* Inspiration Chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {INSPIRATION_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 bg-slate-900 hover:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-800 transition-colors text-left"
                  >
                    "{sample.slice(0, 48)}..."
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 text-xs leading-relaxed">
              Gemini 4 will analyze your current canvas SVG, normalize decimal precision to 2 digits, remove redundant wrappers, and simplify bezier curves without visual degradation.
            </div>
          )}

          {/* Trigger Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading || (mode !== 'optimize' && !prompt.trim())}
              className={`px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg transition-all ${
                isLoading || (mode !== 'optimize' && !prompt.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                  <span>Reasoning & Generating SVG...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{mode === 'optimize' ? 'Run SVG Optimization' : 'Generate Vector Artwork'}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Output Preview Area */}
          {generatedSvg && (
            <div className="flex flex-col gap-2 mt-2 border-t border-[#1E293B] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Generated Vector Result</span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                      activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visual Preview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                      activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-3 h-3" />
                    <span>SVG Markup</span>
                  </button>
                </div>
              </div>

              {activeTab === 'preview' ? (
                <div className="w-full h-64 bg-[#070B12] rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden relative canvas-grid-dots">
                  <div
                    className="max-h-full max-w-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: generatedSvg }}
                  />
                </div>
              ) : (
                <div className="w-full h-64 bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre">
                  {generatedSvg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {generatedSvg && (
          <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between">
            <span className="text-slate-400 text-xs">
              Ready to import as editable nodes into your document hierarchy.
            </span>
            <button
              onClick={handleApplyToCanvas}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Insert into Vectura Canvas</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
