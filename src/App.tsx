import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ProjectDocument, 
  SvgNode, 
  ToolType, 
  ViewMode, 
  PlatformPreset, 
  CanvasSettings, 
  AnimationTimeline, 
  Keyframe, 
  EasingType 
} from './types/editor';
import { PluginContext } from './types/plugin';
import { Header } from './components/Header';
import { LeftDock } from './components/LeftDock';
import { Canvas } from './components/Canvas';
import { RightDock } from './components/RightDock';
import { XmlEditorPane } from './components/XmlEditorPane';
import { Timeline } from './components/Timeline';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ExportModal } from './components/ExportModal';
import { PluginManagerModal } from './components/PluginManagerModal';
import { DocsModal, DocTab } from './components/DocsModal';
import { AboutModal } from './components/AboutModal';
import { sampleCyberEmblem } from './utils/sampleDocuments';
import { nodesToSvgString, svgStringToNodes, generateId, downloadBlob } from './utils/svgParser';
import { HistoryManager } from './utils/history';
import { defaultPluginRegistry } from './plugins';
import { getAnimatedNodeAttributes } from './utils/animationEngine';

export default function App() {
  // Document state initialized with the rich Cyber Emblem sample
  const [doc, setDoc] = useState<ProjectDocument>(sampleCyberEmblem);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(['central_energy_orb']);
  const [activeTool, setActiveTool] = useState<ToolType | string>('select');
  const [viewMode, setViewMode] = useState<ViewMode>('canvas');
  const [platform, setPlatform] = useState<PlatformPreset>('web');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<DocTab>('documentation');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  // Undo / Redo History Manager
  const historyRef = useRef<HistoryManager>(new HistoryManager(sampleCyberEmblem.rootNodes, ['central_energy_orb']));
  const [, setHistoryTick] = useState(0); // Trigger re-render on history push/undo/redo

  const notify = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Sync XML representation
  const currentSvgString = useMemo(() => {
    return nodesToSvgString(doc.rootNodes, doc.canvas, { standalone: true });
  }, [doc.rootNodes, doc.canvas]);

  // Compute animated attributes map for active keyframes
  const animatedAttributesMap = useMemo(() => {
    if (doc.animation.keyframes.length === 0) return {};
    const map: Record<string, any> = {};
    for (const node of doc.rootNodes) {
      map[node.id] = getAnimatedNodeAttributes(node, doc.animation.currentTimeMs, doc.animation.keyframes);
    }
    return map;
  }, [doc.rootNodes, doc.animation.currentTimeMs, doc.animation.keyframes]);

  // State modification helpers with history capture
  const updateNodes = useCallback((newNodes: SvgNode[], actionDesc = 'Edit Document', forceSnapshot = false) => {
    setDoc(prev => ({
      ...prev,
      rootNodes: newNodes,
      updatedAt: new Date().toISOString(),
    }));
    historyRef.current.push(newNodes, selectedNodeIds, actionDesc, forceSnapshot);
    setHistoryTick(t => t + 1);
  }, [selectedNodeIds]);

  const handleUpdateNode = useCallback((id: string, updates: Partial<SvgNode>, actionDesc = 'Update Node') => {
    function recursiveUpdate(nodes: SvgNode[]): SvgNode[] {
      return nodes.map(node => {
        if (node.id === id) {
          const mergedAttrs = updates.attributes ? { ...node.attributes, ...updates.attributes } : node.attributes;
          return {
            ...node,
            ...updates,
            attributes: mergedAttrs,
          };
        }
        if (node.children) {
          return {
            ...node,
            children: recursiveUpdate(node.children),
          };
        }
        return node;
      });
    }

    const updated = recursiveUpdate(doc.rootNodes);
    updateNodes(updated, actionDesc);
  }, [doc.rootNodes, updateNodes]);

  const handleAddNode = useCallback((newNode: SvgNode, actionDesc = 'Add Element') => {
    const updated = [...doc.rootNodes, newNode];
    updateNodes(updated, actionDesc, true);
    setSelectedNodeIds([newNode.id]);
  }, [doc.rootNodes, updateNodes]);

  const handleDeleteNode = useCallback((id: string) => {
    function recursiveDelete(nodes: SvgNode[]): SvgNode[] {
      return nodes
        .filter(n => n.id !== id)
        .map(n => n.children ? { ...n, children: recursiveDelete(n.children) } : n);
    }
    const updated = recursiveDelete(doc.rootNodes);
    updateNodes(updated, 'Delete Layer', true);
    setSelectedNodeIds(prev => prev.filter(selectedId => selectedId !== id));
  }, [doc.rootNodes, updateNodes]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    function recursiveDeleteSelected(nodes: SvgNode[]): SvgNode[] {
      return nodes
        .filter(n => !selectedNodeIds.includes(n.id))
        .map(n => n.children ? { ...n, children: recursiveDeleteSelected(n.children) } : n);
    }
    const updated = recursiveDeleteSelected(doc.rootNodes);
    updateNodes(updated, `Delete ${selectedNodeIds.length} Elements`, true);
    setSelectedNodeIds([]);
  }, [doc.rootNodes, selectedNodeIds, updateNodes]);

  const handleDuplicateSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const toDuplicate = doc.rootNodes.filter(n => selectedNodeIds.includes(n.id));
    const duplicatedNodes = toDuplicate.map(node => {
      const newId = generateId(node.type);
      return {
        ...node,
        id: newId,
        name: `${node.name} Copy`,
        attributes: {
          ...node.attributes,
          x: (node.attributes.x || 0) + 20,
          y: (node.attributes.y || 0) + 20,
          cx: node.attributes.cx ? node.attributes.cx + 20 : undefined,
          cy: node.attributes.cy ? node.attributes.cy + 20 : undefined,
        },
      };
    });

    const updated = [...doc.rootNodes, ...duplicatedNodes];
    updateNodes(updated, 'Duplicate Selected', true);
    setSelectedNodeIds(duplicatedNodes.map(n => n.id));
  }, [doc.rootNodes, selectedNodeIds, updateNodes]);

  // Undo & Redo Handlers
  const handleUndo = useCallback(() => {
    const previous = historyRef.current.undo();
    if (previous) {
      setDoc(prev => ({
        ...prev,
        rootNodes: previous.nodes,
      }));
      setSelectedNodeIds(previous.selectedNodeIds);
      setHistoryTick(t => t + 1);
      notify(`Undo: ${previous.action}`, 'info');
    }
  }, [notify]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next) {
      setDoc(prev => ({
        ...prev,
        rootNodes: next.nodes,
      }));
      setSelectedNodeIds(next.selectedNodeIds);
      setHistoryTick(t => t + 1);
      notify(`Redo: ${next.action}`, 'info');
    }
  }, [notify]);

  // Layer Reordering
  const handleMoveNodeDepth = useCallback((id: string, direction: 'up' | 'down' | 'front' | 'back') => {
    const idx = doc.rootNodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const newNodes = [...doc.rootNodes];
    const [moved] = newNodes.splice(idx, 1);

    if (direction === 'up' && idx < newNodes.length) {
      newNodes.splice(idx + 1, 0, moved);
    } else if (direction === 'down' && idx > 0) {
      newNodes.splice(idx - 1, 0, moved);
    } else if (direction === 'front') {
      newNodes.push(moved);
    } else if (direction === 'back') {
      newNodes.unshift(moved);
    } else {
      newNodes.splice(idx, 0, moved);
      return;
    }

    updateNodes(newNodes, `Reorder Layer ${direction}`);
  }, [doc.rootNodes, updateNodes]);

  // Grouping
  const handleGroupSelected = useCallback(() => {
    if (selectedNodeIds.length < 2) return;
    const selectedNodes = doc.rootNodes.filter(n => selectedNodeIds.includes(n.id));
    const remainingNodes = doc.rootNodes.filter(n => !selectedNodeIds.includes(n.id));

    const groupNode: SvgNode = {
      id: generateId('group'),
      type: 'g',
      name: `Group (${selectedNodes.length})`,
      attributes: {},
      children: selectedNodes,
      isVisible: true,
      isLocked: false,
    };

    const updated = [...remainingNodes, groupNode];
    updateNodes(updated, 'Group Elements', true);
    setSelectedNodeIds([groupNode.id]);
  }, [doc.rootNodes, selectedNodeIds, updateNodes]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const primaryId = selectedNodeIds[0];
    const groupNode = doc.rootNodes.find(n => n.id === primaryId);
    if (!groupNode || groupNode.type !== 'g' || !groupNode.children) return;

    const remainingNodes = doc.rootNodes.filter(n => n.id !== primaryId);
    const updated = [...remainingNodes, ...groupNode.children];
    updateNodes(updated, 'Ungroup Elements', true);
    setSelectedNodeIds(groupNode.children.map(c => c.id));
  }, [doc.rootNodes, selectedNodeIds, updateNodes]);

  // Alignment
  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedNodeIds.length === 0) return;
    const primaryId = selectedNodeIds[0];
    const primaryNode = doc.rootNodes.find(n => n.id === primaryId);
    if (!primaryNode) return;

    const cW = doc.canvas.width;
    const cH = doc.canvas.height;
    const attrs = primaryNode.attributes;
    const w = attrs.width || attrs.r ? attrs.r! * 2 : 100;
    const h = attrs.height || attrs.r ? attrs.r! * 2 : 100;

    let updates: any = {};
    if (alignment === 'left') updates.x = 20;
    if (alignment === 'center') updates.x = Math.round((cW - w) / 2);
    if (alignment === 'right') updates.x = Math.round(cW - w - 20);
    if (alignment === 'top') updates.y = 20;
    if (alignment === 'middle') updates.y = Math.round((cH - h) / 2);
    if (alignment === 'bottom') updates.y = Math.round(cH - h - 20);

    if (primaryNode.type === 'circle') {
      if (updates.x !== undefined) updates.cx = updates.x + (attrs.r || 50);
      if (updates.y !== undefined) updates.cy = updates.y + (attrs.r || 50);
      delete updates.x;
      delete updates.y;
    }

    handleUpdateNode(primaryId, updates, `Align ${alignment}`);
  }, [selectedNodeIds, doc.rootNodes, doc.canvas, handleUpdateNode]);

  // Keyframing helpers
  const handleAddKeyframe = useCallback((elementId: string, property: Keyframe['property'], value: any, easing: EasingType = 'ease-in-out') => {
    const newKf: Keyframe = {
      id: generateId('kf'),
      elementId,
      property,
      timeMs: doc.animation.currentTimeMs,
      value,
      easing,
    };

    setDoc(prev => {
      // Overwrite if keyframe exists at exactly same timestamp and property
      const filtered = prev.animation.keyframes.filter(k => !(k.elementId === elementId && k.property === property && Math.abs(k.timeMs - prev.animation.currentTimeMs) < 30));
      return {
        ...prev,
        animation: {
          ...prev.animation,
          keyframes: [...filtered, newKf],
        },
      };
    });
    notify(`Keyframe added for ${property}`, 'success');
  }, [doc.animation.currentTimeMs, notify]);

  const handleRemoveKeyframe = useCallback((keyframeId: string) => {
    setDoc(prev => ({
      ...prev,
      animation: {
        ...prev.animation,
        keyframes: prev.animation.keyframes.filter(k => k.id !== keyframeId),
      },
    }));
  }, []);

  const handleUpdateKeyframeTime = useCallback((keyframeId: string, newTimeMs: number) => {
    setDoc(prev => ({
      ...prev,
      animation: {
        ...prev.animation,
        keyframes: prev.animation.keyframes.map(k => k.id === keyframeId ? { ...k, timeMs: Math.max(0, Math.min(prev.animation.durationMs, newTimeMs)) } : k),
      },
    }));
  }, []);

  // Save / Load / Sample
  const handleNewDocument = () => {
    const blankDoc: ProjectDocument = {
      id: generateId('doc'),
      title: 'Untitled Vector Artwork',
      version: '1.0.0',
      canvas: {
        width: 800,
        height: 600,
        background: '#0B0F17',
        showGrid: true,
        snapToGrid: false,
        gridSize: 20,
        showRulers: true,
      },
      rootNodes: [],
      animation: {
        durationMs: 3000,
        currentTimeMs: 0,
        fps: 60,
        isPlaying: false,
        isLooping: true,
        keyframes: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDoc(blankDoc);
    setSelectedNodeIds([]);
    historyRef.current.clear([], []);
    setHistoryTick(t => t + 1);
    notify('Created new blank document', 'info');
  };

  const handleOpenSvgFile = async (file: File) => {
    try {
      const text = await file.text();
      const { nodes, canvasSettings } = svgStringToNodes(text);
      setDoc(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, ''),
        canvas: { ...prev.canvas, ...(canvasSettings || {}) },
        rootNodes: nodes,
      }));
      setSelectedNodeIds(nodes.length > 0 ? [nodes[0].id] : []);
      historyRef.current.clear(nodes, nodes.length > 0 ? [nodes[0].id] : []);
      setHistoryTick(t => t + 1);
      notify(`Loaded SVG: ${file.name} (${nodes.length} elements)`, 'success');
    } catch (err: any) {
      notify(`Failed to open SVG: ${err.message}`, 'error');
    }
  };

  const handleSaveProject = () => {
    const jsonStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadBlob(blob, `${doc.title.toLowerCase().replace(/\s+/g, '_')}.vectura`);
    notify('Saved project file', 'success');
  };

  const handleLoadSample = (sample: ProjectDocument) => {
    setDoc(sample);
    setSelectedNodeIds(sample.rootNodes.length > 0 ? [sample.rootNodes[0].id] : []);
    historyRef.current.clear(sample.rootNodes, sample.rootNodes.length > 0 ? [sample.rootNodes[0].id] : []);
    setHistoryTick(t => t + 1);
    notify(`Loaded sample: ${sample.title}`, 'info');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('node');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pen');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('rect');
      } else if (e.key === 'o' || e.key === 'O') {
        setActiveTool('circle');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveTool('eyedropper');
      } else if (e.key === ' ') {
        e.preventDefault();
        setDoc(prev => ({
          ...prev,
          animation: { ...prev.animation, isPlaying: !prev.animation.isPlaying },
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateSelected, handleDeleteSelected]);

  // Plugin Context creation
  const pluginContext: PluginContext = useMemo(() => ({
    document: doc,
    selectedNodeIds,
    setNodes: (newNodes, actionDesc) => updateNodes(newNodes, actionDesc, true),
    updateNode: (id, updates, actionDesc) => handleUpdateNode(id, updates, actionDesc),
    addNode: (node, actionDesc) => handleAddNode(node, actionDesc),
    deleteSelectedNodes: handleDeleteSelected,
    canvas: doc.canvas,
    notify,
  }), [doc, selectedNodeIds, updateNodes, handleUpdateNode, handleAddNode, handleDeleteSelected, notify]);

  const activePluginTools = defaultPluginRegistry.getActiveTools();
  const activePluginEffects = defaultPluginRegistry.getActiveEffects();
  const activePluginExporters = defaultPluginRegistry.getActiveExporters();

  const selectedNode = selectedNodeIds.length === 1 ? doc.rootNodes.find(n => n.id === selectedNodeIds[0]) || null : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B12] text-slate-100 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-16 right-6 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 ${
          toast.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800' :
          toast.type === 'error' ? 'bg-red-950/90 text-red-300 border-red-800' :
          toast.type === 'warning' ? 'bg-amber-950/90 text-amber-300 border-amber-800' :
          'bg-slate-900/90 text-indigo-300 border-indigo-800/80'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Studio Top Header */}
      <Header
        document={doc}
        viewMode={viewMode}
        setViewMode={setViewMode}
        platform={platform}
        setPlatform={setPlatform}
        canUndo={historyRef.current.canUndo()}
        canRedo={historyRef.current.canRedo()}
        undoAction={historyRef.current.getUndoAction()}
        redoAction={historyRef.current.getRedoAction()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewDocument={handleNewDocument}
        onOpenSvgFile={handleOpenSvgFile}
        onSaveProject={handleSaveProject}
        onLoadSample={handleLoadSample}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPluginModal={() => setIsPluginModalOpen(true)}
        onOpenHelpDoc={(tab) => {
          setActiveDocTab(tab);
          setIsDocsModalOpen(true);
        }}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Dock: Tools & Document Layer Tree (Hidden in full XML mode) */}
        {viewMode !== 'code' && (
          <LeftDock
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            pluginTools={activePluginTools}
            nodes={doc.rootNodes}
            selectedNodeIds={selectedNodeIds}
            onSelectNode={(id, multi) => {
              if (id === null) {
                setSelectedNodeIds([]);
              } else if (multi) {
                setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              } else {
                setSelectedNodeIds([id]);
              }
            }}
            onToggleVisibility={(id) => {
              const node = doc.rootNodes.find(n => n.id === id);
              if (node) handleUpdateNode(id, { isVisible: node.isVisible === false ? true : false }, 'Toggle Layer Visibility');
            }}
            onToggleLock={(id) => {
              const node = doc.rootNodes.find(n => n.id === id);
              if (node) handleUpdateNode(id, { isLocked: !node.isLocked }, 'Toggle Layer Lock');
            }}
            onRenameNode={(id, newName) => handleUpdateNode(id, { name: newName }, 'Rename Layer')}
            onDeleteNode={handleDeleteNode}
            onMoveNodeDepth={handleMoveNodeDepth}
            onGroupSelected={handleGroupSelected}
            onUngroupSelected={handleUngroupSelected}
          />
        )}

        {/* Center: Canvas Viewport */}
        {viewMode !== 'code' && (
          <Canvas
            settings={doc.canvas}
            setSettings={(newSettings) => setDoc(prev => ({ ...prev, canvas: typeof newSettings === 'function' ? newSettings(prev.canvas) : newSettings }))}
            nodes={doc.rootNodes}
            selectedNodeIds={selectedNodeIds}
            activeTool={activeTool}
            pluginTools={activePluginTools}
            pluginContext={pluginContext}
            onSelectNode={(id, multi) => {
              if (id === null) {
                setSelectedNodeIds([]);
              } else if (multi) {
                setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
              } else {
                setSelectedNodeIds([id]);
              }
            }}
            onUpdateNode={handleUpdateNode}
            onAddNode={handleAddNode}
            animatedAttributesMap={animatedAttributesMap}
            onSampleColor={(sampledColor) => {
              if (selectedNodeIds.length > 0) {
                handleUpdateNode(selectedNodeIds[0], { attributes: { fill: sampledColor } }, 'Sample Fill Color');
                notify(`Sampled color: ${sampledColor}`, 'success');
              }
            }}
          />
        )}

        {/* Split View / XML Code Editor */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className={`${viewMode === 'code' ? 'w-full' : 'w-1/2'} h-full flex flex-col`}>
            <XmlEditorPane
              currentSvgString={currentSvgString}
              onApplyXmlChanges={(newNodes, newCanvasSettings) => {
                setDoc(prev => ({
                  ...prev,
                  rootNodes: newNodes,
                  canvas: { ...prev.canvas, ...(newCanvasSettings || {}) },
                }));
                historyRef.current.push(newNodes, selectedNodeIds, 'Apply XML Source Edit', true);
                setHistoryTick(t => t + 1);
                notify('Applied XML source changes to canvas', 'success');
              }}
            />
          </div>
        )}

        {/* Right Dock: Properties Inspector & Plugin Effects (Hidden in full XML mode) */}
        {viewMode !== 'code' && (
          <RightDock
            selectedNode={selectedNode}
            onUpdateSelected={(updates, actionDesc) => {
              if (selectedNodeIds.length > 0) {
                handleUpdateNode(selectedNodeIds[0], { attributes: updates }, actionDesc);
              }
            }}
            canvasSettings={doc.canvas}
            setCanvasSettings={(newSettings) => setDoc(prev => ({ ...prev, canvas: typeof newSettings === 'function' ? newSettings(prev.canvas) : newSettings }))}
            pluginEffects={activePluginEffects}
            pluginContext={pluginContext}
            onAlign={handleAlign}
          />
        )}
      </div>

      {/* Bottom: Motion Graphics Keyframe Timeline */}
      <Timeline
        timeline={doc.animation}
        setTimeline={(newTimeline) => setDoc(prev => ({ ...prev, animation: typeof newTimeline === 'function' ? newTimeline(prev.animation) : newTimeline }))}
        nodes={doc.rootNodes}
        selectedNodeIds={selectedNodeIds}
        onAddKeyframe={handleAddKeyframe}
        onRemoveKeyframe={handleRemoveKeyframe}
        onUpdateKeyframeTime={handleUpdateKeyframeTime}
      />

      {/* Modals */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentSvgString={currentSvgString}
        canvasSettings={doc.canvas}
        onInsertGeneratedNodes={(newNodes, actionDesc) => {
          updateNodes([...doc.rootNodes, ...newNodes], actionDesc, true);
          notify(`Inserted ${newNodes.length} AI generated vector elements`, 'success');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={doc}
        pluginExporters={activePluginExporters}
      />

      <PluginManagerModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
        plugins={defaultPluginRegistry.getAllPlugins()}
        onTogglePlugin={(pluginId) => {
          defaultPluginRegistry.togglePlugin(pluginId);
          setHistoryTick(t => t + 1);
          notify('Plugin state updated', 'info');
        }}
      />

      <DocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        initialTab={activeDocTab}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onOpenDocs={(tab) => {
          setActiveDocTab(tab);
          setIsDocsModalOpen(true);
        }}
      />
    </div>
  );
}
