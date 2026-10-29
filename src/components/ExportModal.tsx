import React, { useState } from 'react';
import { 
  Download, 
  X, 
  FileCode, 
  Image as ImageIcon, 
  FileText, 
  Smartphone, 
  Check, 
  Loader2, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { ProjectDocument } from '../types/editor';
import { PluginExporter } from '../types/plugin';
import { 
  nodesToSvgString, 
  exportToPng, 
  exportToPdf, 
  downloadBlob 
} from '../utils/svgParser';
import { generateAnimatedSvgString } from '../utils/animationEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProjectDocument;
  pluginExporters: PluginExporter[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document,
  pluginExporters,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'svg' | 'png' | 'pdf' | string>('svg');
  const [pngScale, setPngScale] = useState<number>(2);
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [includeAnimation, setIncludeAnimation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filenameBase = document.title.toLowerCase().replace(/\s+/g, '_') || 'vectura_artwork';

      if (selectedFormat === 'svg') {
        let svgOutput = nodesToSvgString(document.rootNodes, document.canvas, { standalone: true });

        // If includeAnimation, inject CSS keyframes into <style> inside <svg>
        if (includeAnimation && document.animation.keyframes.length > 0) {
          const cssAnimation = generateAnimatedSvgString(
            document.rootNodes,
            document.canvas.width,
            document.canvas.height,
            document.animation.durationMs,
            document.animation.keyframes
          );
          svgOutput = svgOutput.replace('</svg>', `<style>${cssAnimation}</style>\n</svg>`);
        }

        const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, `${filenameBase}.svg`);
      } else if (selectedFormat === 'png') {
        const svgOutput = nodesToSvgString(document.rootNodes, document.canvas, { standalone: true });
        const bg = includeBackground ? document.canvas.background : undefined;
        const pngBlob = await exportToPng(
          svgOutput,
          document.canvas.width,
          document.canvas.height,
          pngScale,
          bg
        );
        downloadBlob(pngBlob, `${filenameBase}_${pngScale}x.png`);
      } else if (selectedFormat === 'pdf') {
        const svgOutput = nodesToSvgString(document.rootNodes, document.canvas, { standalone: true });
        const pdfBlob = await exportToPdf(
          svgOutput,
          document.canvas.width,
          document.canvas.height,
          filenameBase
        );
        downloadBlob(pdfBlob, `${filenameBase}.pdf`);
      } else {
        // Plugin Exporter
        const exporter = pluginExporters.find(e => e.id === selectedFormat);
        if (exporter) {
          const result = await exporter.export(document);
          const blob = typeof result.data === 'string'
            ? new Blob([result.data], { type: exporter.mimeType })
            : result.data;
          downloadBlob(blob, result.filename);
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0E1522] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0F1A]">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-100 text-sm">Export Studio Graphics</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Grid */}
        <div className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2">
            {/* SVG */}
            <button
              onClick={() => setSelectedFormat('svg')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedFormat === 'svg'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-xs">Vector SVG</span>
              <span className="text-[10px] text-slate-500">Lossless & Scalable</span>
            </button>

            {/* PNG */}
            <button
              onClick={() => setSelectedFormat('png')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedFormat === 'png'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-xs">Raster PNG</span>
              <span className="text-[10px] text-slate-500">1x to 8x High-Res</span>
            </button>

            {/* PDF */}
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedFormat === 'pdf'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-xs">Vector PDF</span>
              <span className="text-[10px] text-slate-500">Print & Document</span>
            </button>

            {/* Plugin Exporter: React Native */}
            <button
              onClick={() => setSelectedFormat('react-native-svg-jsx')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                selectedFormat === 'react-native-svg-jsx'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-xs">React Native</span>
              <span className="text-[10px] text-slate-500">iOS / Android TSX</span>
            </button>
          </div>

          {/* Configurable Format Options */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col gap-3">
            {selectedFormat === 'svg' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Embed CSS Keyframe Animation</span>
                  <input
                    type="checkbox"
                    checked={includeAnimation}
                    onChange={(e) => setIncludeAnimation(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Embeds timeline keyframes into standalone CSS @keyframes inside the SVG file for native browser motion.
                </span>
              </div>
            )}

            {selectedFormat === 'png' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Resolution Scale Factor</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                    {[1, 2, 4, 8].map(scale => (
                      <button
                        key={scale}
                        onClick={() => setPngScale(scale)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                          pngScale === scale ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300">Include Canvas Background</span>
                  <input
                    type="checkbox"
                    checked={includeBackground}
                    onChange={(e) => setIncludeBackground(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  Output Dimensions: {document.canvas.width * pngScale} × {document.canvas.height * pngScale} px
                </span>
              </div>
            )}

            {selectedFormat === 'pdf' && (
              <div className="flex flex-col gap-1 text-slate-400">
                <span>Vector PDF output with preserved aspect ratio ({document.canvas.width}pt × {document.canvas.height}pt).</span>
              </div>
            )}

            {selectedFormat === 'react-native-svg-jsx' && (
              <div className="flex flex-col gap-1 text-slate-400">
                <span>Converts all SVG primitives into clean TypeScript React Native &lt;Svg&gt;, &lt;Path&gt;, &lt;Rect&gt; components.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-colors"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting File...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {selectedFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
