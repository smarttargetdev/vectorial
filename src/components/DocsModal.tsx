import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Download, 
  Search, 
  FileText, 
  Layers, 
  Cpu, 
  Check, 
  Copy 
} from 'lucide-react';
import { documentationData } from '../docs/documentationData';
import { downloadBlob } from '../utils/svgParser';

export type DocTab = 'documentation' | 'architecture' | 'components';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DocTab;
}

export const DocsModal: React.FC<DocsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'documentation',
}) => {
  const [activeTab, setActiveTab] = useState<DocTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const getDocContent = (): { title: string; filename: string; content: string } => {
    switch (activeTab) {
      case 'architecture':
        return {
          title: 'System Architecture',
          filename: 'Architecture.md',
          content: documentationData.architecture,
        };
      case 'components':
        return {
          title: 'Component Technical Reference',
          filename: 'Components.md',
          content: documentationData.components,
        };
      case 'documentation':
      default:
        return {
          title: 'User Guide & Documentation',
          filename: 'Documentation.md',
          content: documentationData.documentation,
        };
    }
  };

  const currentDoc = getDocContent();

  const handleDownloadMarkdown = () => {
    const blob = new Blob([currentDoc.content], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, currentDoc.filename);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter content lines if search query is present
  const renderContent = () => {
    const content = currentDoc.content;
    if (!searchQuery.trim()) {
      return (
        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed font-normal">
          {content}
        </pre>
      );
    }

    const lines = content.split('\n');
    const filtered = lines.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div className="flex flex-col gap-2">
        <div className="text-[11px] text-amber-400 font-mono">
          Found {filtered.length} matching lines for "{searchQuery}":
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
          {filtered.join('\n')}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#0E1522] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col h-[640px] overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0F1A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">Vector Studio Documentation</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                  v{documentationData.version}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Technical manuals, architectural specifications, and component reference
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab & Search Sub-Header */}
        <div className="px-4 py-2 border-b border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between gap-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => { setActiveTab('documentation'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'documentation' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documentation.md</span>
            </button>
            <button
              onClick={() => { setActiveTab('architecture'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'architecture' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Architecture.md</span>
            </button>
            <button
              onClick={() => { setActiveTab('components'); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'components' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Components.md</span>
            </button>
          </div>

          {/* Search Filter Input */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 w-64 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs"
            />
          </div>
        </div>

        {/* Document Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#070B12] select-text">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between text-slate-500 text-[11px]">
          <span>Stored as active project artifact and bundled into distribution releases.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
