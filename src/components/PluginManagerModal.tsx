import React, { useState } from 'react';
import { 
  Puzzle, 
  X, 
  Check, 
  Smartphone, 
  Sparkles, 
  Compass, 
  Zap, 
  Feather, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';
import { VecturaPlugin } from '../types/plugin';

interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: VecturaPlugin[];
  onTogglePlugin: (pluginId: string) => void;
}

export const PluginManagerModal: React.FC<PluginManagerModalProps> = ({
  isOpen,
  onClose,
  plugins,
  onTogglePlugin,
}) => {
  const [selectedPluginId, setSelectedPluginId] = useState<string>(plugins[0]?.id || '');

  if (!isOpen) return null;

  const selectedPlugin = plugins.find(p => p.id === selectedPluginId) || plugins[0];

  const getPluginIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-purple-400" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Feather':
        return <Feather className="w-4 h-4 text-emerald-400" />;
      default:
        return <Puzzle className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0E1522] border border-[#1E293B] rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0F1A]">
          <div className="flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-100 text-sm">Vectura Plugin Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Installed Plugins List */}
          <div className="w-64 bg-[#0A0F1A] border-r border-[#1E293B] flex flex-col overflow-y-auto p-2 gap-1">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Installed Plugins ({plugins.length})
            </div>
            {plugins.map(plugin => {
              const isSelected = plugin.id === selectedPluginId;
              return (
                <div
                  key={plugin.id}
                  onClick={() => setSelectedPluginId(plugin.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">
                      {getPluginIcon(plugin.icon)}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold truncate">{plugin.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">v{plugin.version}</div>
                    </div>
                  </div>

                  {/* Toggle Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlugin(plugin.id);
                    }}
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ml-2 ${
                      plugin.enabled ? 'bg-indigo-600 text-white' : 'border border-slate-700 bg-slate-800'
                    }`}
                  >
                    {plugin.enabled && <Check className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Plugin Details & Capabilities */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {selectedPlugin && (
              <>
                <div className="flex items-start justify-between border-b border-[#1E293B] pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      {selectedPlugin.name}
                      <span className="text-xs font-mono font-normal text-slate-500">v{selectedPlugin.version}</span>
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      By <span className="text-slate-300 font-medium">{selectedPlugin.author}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onTogglePlugin(selectedPlugin.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedPlugin.enabled
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {selectedPlugin.enabled ? 'Active / Enabled' : 'Disabled'}
                  </button>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs">
                  {selectedPlugin.description}
                </p>

                {/* Capabilities Provided */}
                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Hook Registrations
                  </span>

                  {/* Registered Tools */}
                  {selectedPlugin.tools && selectedPlugin.tools.length > 0 && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Custom Canvas Tools ({selectedPlugin.tools.length})</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                        {selectedPlugin.tools.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-0.5">
                            <span className="font-medium">• {t.name}</span>
                            <span className="text-slate-500">{t.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Registered Effects */}
                  {selectedPlugin.effects && selectedPlugin.effects.length > 0 && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Filter & Appearance Effects ({selectedPlugin.effects.length})</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                        {selectedPlugin.effects.map(e => (
                          <div key={e.id} className="flex items-center justify-between py-0.5">
                            <span className="font-medium">• {e.name}</span>
                            <span className="text-slate-500">{e.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Registered Exporters */}
                  {selectedPlugin.exporters && selectedPlugin.exporters.length > 0 && (
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Target Exporters ({selectedPlugin.exporters.length})</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                        {selectedPlugin.exporters.map(exp => (
                          <div key={exp.id} className="flex items-center justify-between py-0.5">
                            <span className="font-medium">• {exp.name} (.{exp.fileExtension})</span>
                            <span className="text-slate-500">{exp.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0A0F1A] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plugin sandbox verified and active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
