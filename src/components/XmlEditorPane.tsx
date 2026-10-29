import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  RotateCcw, 
  Wand2 
} from 'lucide-react';
import { svgStringToNodes } from '../utils/svgParser';
import { SvgNode, CanvasSettings } from '../types/editor';

interface XmlEditorPaneProps {
  currentSvgString: string;
  onApplyXmlChanges: (newNodes: SvgNode[], canvasSettings?: Partial<CanvasSettings>) => void;
  onOptimizeXmlWithAi?: () => void;
}

export const XmlEditorPane: React.FC<XmlEditorPaneProps> = ({
  currentSvgString,
  onApplyXmlChanges,
  onOptimizeXmlWithAi,
}) => {
  const [code, setCode] = useState<string>(currentSvgString);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState<boolean>(false);

  // Sync external SVG changes into code editor when not actively dirty
  useEffect(() => {
    setCode(currentSvgString);
    setHasUnappliedChanges(false);
    setParseError(null);
  }, [currentSvgString]);

  // Validate XML on input
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHasUnappliedChanges(true);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(newCode, 'image/svg+xml');
      const error = doc.querySelector('parsererror');
      if (error) {
        setParseError('XML Syntax Error: ' + error.textContent?.split('\n')[0]);
      } else {
        setParseError(null);
      }
    } catch (e: any) {
      setParseError(e.message);
    }
  };

  const handleApply = () => {
    try {
      const { nodes, canvasSettings } = svgStringToNodes(code);
      onApplyXmlChanges(nodes, canvasSettings);
      setHasUnappliedChanges(false);
      setParseError(null);
    } catch (e: any) {
      setParseError('Failed to parse into vector nodes: ' + e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format / Prettify SVG XML
  const handleFormat = () => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'image/svg+xml');
      if (doc.querySelector('parsererror')) return;

      function prettifyNode(node: Node, level = 0): string {
        const indent = '  '.repeat(level);
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          return text ? `${indent}${text}\n` : '';
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          let attrs = '';
          for (let i = 0; i < el.attributes.length; i++) {
            const a = el.attributes[i];
            attrs += ` ${a.name}="${a.value}"`;
          }
          if (el.childNodes.length === 0) {
            return `${indent}<${el.tagName.toLowerCase()}${attrs} />\n`;
          }
          let inner = '';
          for (let i = 0; i < el.childNodes.length; i++) {
            inner += prettifyNode(el.childNodes[i], level + 1);
          }
          return `${indent}<${el.tagName.toLowerCase()}${attrs}>\n${inner}${indent}</${el.tagName.toLowerCase()}>\n`;
        }
        return '';
      }

      const formatted = prettifyNode(doc.documentElement, 0);
      setCode(formatted.trim());
      setHasUnappliedChanges(true);
    } catch {
      // Keep existing code if error
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080C14] border-l border-[#1E293B] text-xs font-mono select-text">
      {/* Top Action Bar */}
      <div className="h-9 px-3 bg-[#0E1522] border-b border-[#1E293B] flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 font-sans">SVG Source Editor</span>
          {hasUnappliedChanges && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-sans">
              Unapplied Edits
            </span>
          )}
          {parseError && (
            <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-sans flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Invalid XML</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFormat}
            title="Prettify XML Code"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs transition-colors"
          >
            Format
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleApply}
            disabled={!!parseError || !hasUnappliedChanges}
            className={`px-3 py-1 rounded font-sans text-xs font-medium transition-colors ${
              !parseError && hasUnappliedChanges
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Apply to Canvas
          </button>
        </div>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="w-10 py-3 bg-[#0A0F1A] border-r border-[#1E293B] text-right pr-2 text-slate-600 select-none text-[11px] leading-5 font-mono overflow-hidden">
          {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 h-full p-3 bg-transparent text-slate-200 resize-none focus:outline-none text-[11px] leading-5 font-mono overflow-auto whitespace-pre selection:bg-indigo-600/30"
        />
      </div>

      {/* Parse Error Banner */}
      {parseError && (
        <div className="p-2 bg-red-950/60 border-t border-red-800/80 text-red-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="truncate">{parseError}</span>
        </div>
      )}
    </div>
  );
};
