import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Plus, 
  Trash2, 
  Sliders, 
  Layers, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Keyframe, SvgNode, EasingType, AnimationTimeline } from '../types/editor';
import { generateId } from '../utils/svgParser';

interface TimelineProps {
  timeline: AnimationTimeline;
  setTimeline: React.Dispatch<React.SetStateAction<AnimationTimeline>>;
  nodes: SvgNode[];
  selectedNodeIds: string[];
  onAddKeyframe: (elementId: string, property: Keyframe['property'], value: any, easing?: EasingType) => void;
  onRemoveKeyframe: (keyframeId: string) => void;
  onUpdateKeyframeTime: (keyframeId: string, newTimeMs: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  setTimeline,
  nodes,
  selectedNodeIds,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframeTime,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);
  const [expandedTrackIds, setExpandedTrackIds] = useState<Set<string>>(new Set());

  // Real-time animation playback loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaMs = now - lastTimestamp;
      lastTimestamp = now;

      if (timeline.isPlaying) {
        setTimeline(prev => {
          let nextTime = prev.currentTimeMs + deltaMs;
          if (nextTime >= prev.durationMs) {
            if (prev.isLooping) {
              nextTime = 0;
            } else {
              nextTime = prev.durationMs;
              return { ...prev, isPlaying: false, currentTimeMs: nextTime };
            }
          }
          return { ...prev, currentTimeMs: nextTime };
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [timeline.isPlaying, timeline.durationMs, timeline.isLooping, setTimeline]);

  // Scrub playhead from mouse position on ruler or track
  const handleScrub = (clientX: number) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newTimeMs = Math.round((clickX / rect.width) * timeline.durationMs);

    setTimeline(prev => ({
      ...prev,
      currentTimeMs: newTimeMs,
    }));
  };

  const handleRulerPointerDown = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    handleScrub(e.clientX);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isScrubbing) {
        handleScrub(e.clientX);
      }
      if (draggingKeyframeId && rulerRef.current) {
        const rect = rulerRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const newTime = Math.round((clickX / rect.width) * timeline.durationMs);
        onUpdateKeyframeTime(draggingKeyframeId, newTime);
      }
    };

    const handlePointerUp = () => {
      setIsScrubbing(false);
      setDraggingKeyframeId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isScrubbing, draggingKeyframeId, timeline.durationMs, onUpdateKeyframeTime]);

  const toggleTrackExpand = (id: string) => {
    setExpandedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Format time mm:ss.SS
  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Add keyframe for primary selected element's current property
  const handleAddCurrentKeyframe = () => {
    const primaryId = selectedNodeIds[0];
    if (!primaryId) return;
    const node = nodes.find(n => n.id === primaryId);
    if (!node) return;

    // Add keyframes for current transforms and appearance
    const attrs = node.attributes;
    if (attrs.x !== undefined) onAddKeyframe(primaryId, 'x', attrs.x);
    if (attrs.y !== undefined) onAddKeyframe(primaryId, 'y', attrs.y);
    if (attrs.rotation !== undefined) onAddKeyframe(primaryId, 'rotation', attrs.rotation);
    if (attrs.opacity !== undefined) onAddKeyframe(primaryId, 'opacity', attrs.opacity);
    if (attrs.fill && attrs.fill !== 'none') onAddKeyframe(primaryId, 'fill', attrs.fill);
    if (attrs.stroke && attrs.stroke !== 'none') onAddKeyframe(primaryId, 'stroke', attrs.stroke);
    if (attrs.strokeWidth !== undefined) onAddKeyframe(primaryId, 'strokeWidth', attrs.strokeWidth);
  };

  // Filter elements that have keyframes or are selected
  const activeElements = nodes.filter(
    n => selectedNodeIds.includes(n.id) || timeline.keyframes.some(k => k.elementId === n.id)
  );

  const selectedKeyframe = timeline.keyframes.find(k => k.id === selectedKeyframeId);

  return (
    <div className="h-48 bg-[#0A0F1A] border-t border-[#1E293B] flex flex-col select-none text-xs z-20 shrink-0">
      {/* Top Playback Toolbar */}
      <div className="h-9 px-3 bg-[#0E1522] border-b border-[#1E293B] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle */}
          <button
            onClick={() => setTimeline(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
            title="Play / Pause (Space)"
          >
            {timeline.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset to Start */}
          <button
            onClick={() => setTimeline(prev => ({ ...prev, currentTimeMs: 0 }))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Rewind to 00:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Loop Toggle */}
          <button
            onClick={() => setTimeline(prev => ({ ...prev, isLooping: !prev.isLooping }))}
            className={`p-1.5 rounded transition-colors ${
              timeline.isLooping ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Loop Playback"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Current Time Display */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-slate-200">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="tabular-nums text-cyan-300 font-semibold">{formatTime(timeline.currentTimeMs)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 tabular-nums">{formatTime(timeline.durationMs)}</span>
          </div>

          {/* Duration Selector */}
          <select
            value={timeline.durationMs}
            onChange={(e) => setTimeline(prev => ({ ...prev, durationMs: Number(e.target.value) }))}
            className="bg-slate-900 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-800 focus:outline-none"
          >
            <option value={1000}>1.0s</option>
            <option value={2000}>2.0s</option>
            <option value={3000}>3.0s</option>
            <option value={4000}>4.0s</option>
            <option value={5000}>5.0s</option>
            <option value={10000}>10.0s</option>
          </select>
        </div>

        {/* Right Keyframe Insertion & Easing Controls */}
        <div className="flex items-center gap-2">
          {selectedKeyframe && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
              <span className="text-slate-500 font-mono">Easing:</span>
              <select
                value={selectedKeyframe.easing}
                onChange={(e) => {
                  const easing = e.target.value as EasingType;
                  setTimeline(prev => ({
                    ...prev,
                    keyframes: prev.keyframes.map(k => k.id === selectedKeyframe.id ? { ...k, easing } : k),
                  }));
                }}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ease-in-out" className="bg-[#131B2E]">Ease In-Out</option>
                <option value="linear" className="bg-[#131B2E]">Linear</option>
                <option value="ease-in" className="bg-[#131B2E]">Ease In</option>
                <option value="ease-out" className="bg-[#131B2E]">Ease Out</option>
                <option value="spring" className="bg-[#131B2E]">Spring Bounce</option>
              </select>

              <button
                onClick={() => onRemoveKeyframe(selectedKeyframe.id)}
                title="Delete Keyframe"
                className="p-1 hover:text-red-400 text-slate-400 ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={handleAddCurrentKeyframe}
            disabled={selectedNodeIds.length === 0}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
              selectedNodeIds.length > 0
                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Keyframe</span>
          </button>
        </div>
      </div>

      {/* Timeline Ruler & Tracks Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Names Sidebar */}
        <div className="w-56 bg-[#0E1522] border-r border-[#1E293B] overflow-y-auto shrink-0 select-none">
          <div className="h-6 px-3 bg-[#0A0F1A] border-b border-[#1E293B] flex items-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Element Tracks
          </div>
          {activeElements.length === 0 ? (
            <div className="p-3 text-[11px] text-slate-500">
              Select an element or add keyframes to animate.
            </div>
          ) : (
            activeElements.map(node => {
              const nodeKeyframes = timeline.keyframes.filter(k => k.elementId === node.id);
              const isExpanded = expandedTrackIds.has(node.id);
              const props = Array.from(new Set(nodeKeyframes.map(k => k.property)));

              return (
                <div key={node.id} className="border-b border-[#1E293B]">
                  <div
                    onClick={() => toggleTrackExpand(node.id)}
                    className="h-7 px-2 flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {props.length > 0 && (
                        isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="truncate font-medium">{node.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400">
                      {nodeKeyframes.length} ◇
                    </span>
                  </div>

                  {/* Sub-tracks if expanded */}
                  {isExpanded && props.map(prop => (
                    <div key={prop} className="h-6 pl-6 pr-2 flex items-center text-[11px] text-slate-400 bg-slate-900/40">
                      <span className="capitalize">{prop}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Right Scrub Area & Keyframe Diamonds Canvas */}
        <div className="flex-1 flex flex-col overflow-x-hidden relative">
          {/* Time Ruler */}
          <div
            ref={rulerRef}
            onPointerDown={handleRulerPointerDown}
            className="h-6 bg-[#0B101D] border-b border-[#1E293B] relative cursor-pointer select-none"
          >
            {/* Tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const pct = (i / 10) * 100;
              const timeAtTick = Math.round((i / 10) * timeline.durationMs);
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-slate-800/80 pointer-events-none"
                  style={{ left: `${pct}%` }}
                >
                  <span className="text-[9px] font-mono text-slate-500 pl-1">
                    {(timeAtTick / 1000).toFixed(1)}s
                  </span>
                </div>
              );
            })}

            {/* Playhead Red Needle */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none"
              style={{ left: `${(timeline.currentTimeMs / timeline.durationMs) * 100}%` }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-sm -ml-1.5 rotate-45 shadow-sm shadow-red-500/50" />
            </div>
          </div>

          {/* Tracks Keyframes Rows */}
          <div className="flex-1 overflow-y-auto relative bg-[#090D17]">
            {/* Playhead Guide Line descending through tracks */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-red-500/60 z-20 pointer-events-none"
              style={{ left: `${(timeline.currentTimeMs / timeline.durationMs) * 100}%` }}
            />

            {activeElements.map(node => {
              const nodeKeyframes = timeline.keyframes.filter(k => k.elementId === node.id);
              const isExpanded = expandedTrackIds.has(node.id);
              const props = Array.from(new Set(nodeKeyframes.map(k => k.property)));

              return (
                <div key={node.id} className="border-b border-[#1E293B]">
                  {/* Master track row */}
                  <div className="h-7 relative hover:bg-slate-800/20">
                    {nodeKeyframes.map(kf => {
                      const pct = (kf.timeMs / timeline.durationMs) * 100;
                      const isSelected = selectedKeyframeId === kf.id;
                      return (
                        <div
                          key={kf.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedKeyframeId(kf.id); }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setSelectedKeyframeId(kf.id);
                            setDraggingKeyframeId(kf.id);
                          }}
                          title={`${kf.property}: ${kf.value} (${(kf.timeMs / 1000).toFixed(2)}s)`}
                          className={`absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rotate-45 cursor-pointer z-10 transition-transform ${
                            isSelected
                              ? 'bg-amber-400 border-2 border-white scale-125 shadow-lg shadow-amber-400/50'
                              : 'bg-indigo-500 hover:bg-indigo-400 border border-slate-900'
                          }`}
                          style={{ left: `${pct}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Sub-track rows */}
                  {isExpanded && props.map(prop => {
                    const propKeyframes = nodeKeyframes.filter(k => k.property === prop);
                    return (
                      <div key={prop} className="h-6 relative bg-slate-900/20 border-t border-slate-800/40">
                        {propKeyframes.map(kf => {
                          const pct = (kf.timeMs / timeline.durationMs) * 100;
                          return (
                            <div
                              key={kf.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedKeyframeId(kf.id); }}
                              className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 rotate-45 bg-cyan-400 border border-slate-900 cursor-pointer z-10 hover:scale-125 transition-transform"
                              style={{ left: `${pct}%` }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
