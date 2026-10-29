import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Grid, 
  Magnet, 
  Move,
  Eye
} from 'lucide-react';
import { 
  SvgNode, 
  ToolType, 
  Point, 
  CanvasSettings, 
  ViewportTransform, 
  PathNodePoint 
} from '../types/editor';
import { PluginTool, PluginContext } from '../types/plugin';
import { generateId } from '../utils/svgParser';

interface CanvasProps {
  settings: CanvasSettings;
  setSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
  nodes: SvgNode[];
  selectedNodeIds: string[];
  activeTool: ToolType | string;
  pluginTools: PluginTool[];
  pluginContext: PluginContext;
  onSelectNode: (id: string | null, multi?: boolean) => void;
  onUpdateNode: (id: string, updates: Partial<SvgNode>, actionDescription?: string) => void;
  onAddNode: (node: SvgNode, actionDescription?: string) => void;
  animatedAttributesMap?: Record<string, any>;
  onSampleColor?: (color: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  settings,
  setSettings,
  nodes,
  selectedNodeIds,
  activeTool,
  pluginTools,
  pluginContext,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  animatedAttributesMap = {},
  onSampleColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Viewport pan & zoom state
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 40,
    y: 40,
    zoom: 1,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Interactive drawing state
  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    startPoint: Point;
    currentPoint: Point;
    tempId?: string;
  }>({
    isDrawing: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
  });

  // Pen Tool active path points
  const [penPoints, setPenPoints] = useState<Point[]>([]);

  // Node editing state for bezier curves
  const [editingPathNodes, setEditingPathNodes] = useState<PathNodePoint[]>([]);
  const [draggingNodeIndex, setDraggingNodeIndex] = useState<{ index: number; handleType: 'anchor' | 'in' | 'out' } | null>(null);

  // Transform Gizmo drag state
  const [transformDrag, setTransformDrag] = useState<{
    active: boolean;
    handle: string; // 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'rotate'
    startPoint: Point;
    initialAttrs: Record<string, any>;
  } | null>(null);

  // Keyboard spacebar detection for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert client pointer event coordinates to SVG canvas space
  const getCanvasPoint = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    let x = (clientX - viewport.x) / viewport.zoom;
    let y = (clientY - viewport.y) / viewport.zoom;

    if (settings.snapToGrid && settings.gridSize > 0) {
      x = Math.round(x / settings.gridSize) * settings.gridSize;
      y = Math.round(y / settings.gridSize) * settings.gridSize;
    }

    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }, [viewport, settings.snapToGrid, settings.gridSize]);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const newZoom = Math.max(0.1, Math.min(32, viewport.zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setViewport({
          zoom: newZoom,
          x: mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom),
          y: mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom),
        });
      }
    } else {
      // Pan
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Center & Fit canvas in viewport
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const margin = 60;
    const availWidth = rect.width - margin * 2;
    const availHeight = rect.height - margin * 2;
    const zoomW = availWidth / settings.width;
    const zoomH = availHeight / settings.height;
    const fitZoom = Math.max(0.1, Math.min(2, Math.min(zoomW, zoomH)));

    setViewport({
      zoom: fitZoom,
      x: (rect.width - settings.width * fitZoom) / 2,
      y: (rect.height - settings.height * fitZoom) / 2,
    });
  };

  const handleResetZoom = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setViewport({
      zoom: 1,
      x: (rect.width - settings.width) / 2,
      y: (rect.height - settings.height) / 2,
    });
  };

  // Sync node editor points when a path is selected in 'node' tool
  useEffect(() => {
    if (activeTool === 'node' && selectedNodeIds.length === 1) {
      const selected = nodes.find(n => n.id === selectedNodeIds[0]);
      if (selected && selected.type === 'path' && selected.attributes.d) {
        // Parse basic anchors from d command
        const d = selected.attributes.d;
        const points: PathNodePoint[] = [];
        const commands = d.match(/([MLCQZ])\s*([^MLCQZ]*)/gi) || [];

        commands.forEach((cmdStr, idx) => {
          const type = cmdStr[0].toUpperCase() as any;
          const coords = cmdStr.substring(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
          if (type === 'M' || type === 'L') {
            if (coords.length >= 2) {
              points.push({
                id: `node_${idx}`,
                x: coords[0],
                y: coords[1],
                type: 'corner',
                command: type,
              });
            }
          } else if (type === 'C') {
            if (coords.length >= 6) {
              points.push({
                id: `node_${idx}`,
                handleIn: { x: coords[0], y: coords[1] },
                handleOut: { x: coords[2], y: coords[3] },
                x: coords[4],
                y: coords[5],
                type: 'smooth',
                command: type,
              });
            }
          }
        });

        setEditingPathNodes(points);
      }
    } else {
      setEditingPathNodes([]);
    }
  }, [activeTool, selectedNodeIds, nodes]);

  // Pointer Down on Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if middle click or spacebar pan
    if (e.button === 1 || spacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    if (e.button !== 0) return; // Only primary button

    const pt = getCanvasPoint(e);

    // Check if active tool is a plugin tool
    const pluginTool = pluginTools.find(t => t.id === activeTool);
    if (pluginTool && pluginTool.onPointerDown) {
      pluginTool.onPointerDown(pt, pluginContext);
      return;
    }

    // Pen tool point insertion
    if (activeTool === 'pen') {
      const updatedPoints = [...penPoints, pt];
      setPenPoints(updatedPoints);

      // Check if clicking near first point to close
      if (penPoints.length > 2) {
        const first = penPoints[0];
        const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
        if (dist < 12) {
          // Close path
          let d = `M ${first.x} ${first.y}`;
          for (let i = 1; i < penPoints.length; i++) {
            d += ` L ${penPoints[i].x} ${penPoints[i].y}`;
          }
          d += ' Z';

          const newPath: SvgNode = {
            id: generateId('path'),
            type: 'path',
            name: `Path ${nodes.length + 1}`,
            attributes: {
              d,
              fill: 'none',
              stroke: '#6366F1',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
            isVisible: true,
            isLocked: false,
          };
          onAddNode(newPath, 'Draw Path');
          setPenPoints([]);
          return;
        }
      }
      return;
    }

    // Text tool: click to place text
    if (activeTool === 'text') {
      const textNode: SvgNode = {
        id: generateId('text'),
        type: 'text',
        name: `Text ${nodes.length + 1}`,
        attributes: {
          x: pt.x,
          y: pt.y,
          textContent: 'Editable Vector Text',
          fontSize: 24,
          fontFamily: 'Plus Jakarta Sans',
          fill: '#F8FAFC',
        },
        isVisible: true,
        isLocked: false,
      };
      onAddNode(textNode, 'Insert Text');
      onSelectNode(textNode.id);
      return;
    }

    // Shape tools: start drag drawing
    if (['rect', 'circle', 'polygon', 'star', 'line'].includes(activeTool)) {
      setDrawingState({
        isDrawing: true,
        startPoint: pt,
        currentPoint: pt,
      });
      return;
    }

    // Deselect if clicking on empty canvas in select mode
    if (activeTool === 'select' && !transformDrag) {
      onSelectNode(null);
    }
  };

  // Pointer Move on Canvas
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    const pt = getCanvasPoint(e);

    // Handle Transform Gizmo Resizing / Moving
    if (transformDrag && transformDrag.active && selectedNodeIds.length === 1) {
      const selectedId = selectedNodeIds[0];
      const selected = nodes.find(n => n.id === selectedId);
      if (!selected) return;

      const dx = pt.x - transformDrag.startPoint.x;
      const dy = pt.y - transformDrag.startPoint.y;
      const initial = transformDrag.initialAttrs;

      if (transformDrag.handle === 'move') {
        const newX = (initial.x || initial.cx || 0) + dx;
        const newY = (initial.y || initial.cy || 0) + dy;
        const updates: any = {};
        if (selected.type === 'circle' || selected.type === 'ellipse') {
          updates.cx = Math.round(newX);
          updates.cy = Math.round(newY);
        } else if (selected.type === 'path') {
          // Translating path uses transform="translate(dx, dy)"
          updates.transform = `translate(${Math.round(dx)}, ${Math.round(dy)})`;
        } else {
          updates.x = Math.round(newX);
          updates.y = Math.round(newY);
        }
        onUpdateNode(selectedId, { attributes: updates }, 'Move Element');
      } else if (['br', 'tr', 'bl', 'tl'].includes(transformDrag.handle)) {
        // Resize
        const newWidth = Math.max(10, (initial.width || 50) + (transformDrag.handle.includes('r') ? dx : -dx));
        const newHeight = Math.max(10, (initial.height || 50) + (transformDrag.handle.includes('b') ? dy : -dy));
        onUpdateNode(selectedId, { attributes: { width: Math.round(newWidth), height: Math.round(newHeight) } }, 'Resize Element');
      } else if (transformDrag.handle === 'rotate') {
        const cx = (initial.x || initial.cx || 0) + (initial.width ? initial.width / 2 : 0);
        const cy = (initial.y || initial.cy || 0) + (initial.height ? initial.height / 2 : 0);
        const angle = Math.round((Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI);
        onUpdateNode(selectedId, { attributes: { rotation: angle } }, 'Rotate Element');
      }
      return;
    }

    // Handle Bezier Node dragging
    if (draggingNodeIndex !== null && selectedNodeIds.length === 1) {
      const { index, handleType } = draggingNodeIndex;
      const updatedNodes = [...editingPathNodes];
      if (handleType === 'anchor') {
        updatedNodes[index].x = pt.x;
        updatedNodes[index].y = pt.y;
      } else if (handleType === 'in') {
        updatedNodes[index].handleIn = pt;
      } else if (handleType === 'out') {
        updatedNodes[index].handleOut = pt;
      }

      setEditingPathNodes(updatedNodes);

      // Reconstruct d string
      let d = '';
      updatedNodes.forEach((node, i) => {
        if (i === 0) {
          d += `M ${node.x} ${node.y}`;
        } else if (node.handleIn && node.handleOut) {
          d += ` C ${node.handleIn.x} ${node.handleIn.y} ${node.handleOut.x} ${node.handleOut.y} ${node.x} ${node.y}`;
        } else {
          d += ` L ${node.x} ${node.y}`;
        }
      });
      d += ' Z';
      onUpdateNode(selectedNodeIds[0], { attributes: { d } }, 'Edit Path Bezier Node');
      return;
    }

    if (drawingState.isDrawing) {
      setDrawingState(prev => ({ ...prev, currentPoint: pt }));
    }
  };

  // Pointer Up on Canvas
  const handlePointerUp = () => {
    setIsPanning(false);

    if (transformDrag) {
      setTransformDrag(null);
      return;
    }

    if (draggingNodeIndex !== null) {
      setDraggingNodeIndex(null);
      return;
    }

    if (drawingState.isDrawing) {
      const { startPoint, currentPoint } = drawingState;
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.y - startPoint.y);
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);

      if (width > 5 || height > 5) {
        let newNode: SvgNode | null = null;

        if (activeTool === 'rect') {
          newNode = {
            id: generateId('rect'),
            type: 'rect',
            name: `Rectangle ${nodes.length + 1}`,
            attributes: {
              x,
              y,
              width,
              height,
              rx: 4,
              ry: 4,
              fill: '#6366F1',
              stroke: 'none',
              strokeWidth: 1,
            },
            isVisible: true,
            isLocked: false,
          };
        } else if (activeTool === 'circle') {
          const r = Math.round(Math.max(width, height) / 2);
          newNode = {
            id: generateId('circle'),
            type: 'circle',
            name: `Circle ${nodes.length + 1}`,
            attributes: {
              cx: x + r,
              cy: y + r,
              r,
              fill: '#06B6D4',
              stroke: 'none',
              strokeWidth: 1,
            },
            isVisible: true,
            isLocked: false,
          };
        } else if (activeTool === 'polygon') {
          // Regular Hexagon
          const cx = x + width / 2;
          const cy = y + height / 2;
          const r = Math.max(width, height) / 2;
          const pointsArr: string[] = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            pointsArr.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }
          newNode = {
            id: generateId('polygon'),
            type: 'polygon',
            name: `Polygon ${nodes.length + 1}`,
            attributes: {
              points: pointsArr.join(' '),
              fill: '#8B5CF6',
              stroke: '#A78BFA',
              strokeWidth: 2,
            },
            isVisible: true,
            isLocked: false,
          };
        } else if (activeTool === 'star') {
          // 5-Pointed Star
          const cx = x + width / 2;
          const cy = y + height / 2;
          const outerR = Math.max(width, height) / 2;
          const innerR = outerR * 0.45;
          const pointsArr: string[] = [];
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            pointsArr.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }
          newNode = {
            id: generateId('star'),
            type: 'polygon',
            name: `Star ${nodes.length + 1}`,
            attributes: {
              points: pointsArr.join(' '),
              fill: '#F59E0B',
              stroke: '#FBBF24',
              strokeWidth: 2,
            },
            isVisible: true,
            isLocked: false,
          };
        } else if (activeTool === 'line') {
          newNode = {
            id: generateId('line'),
            type: 'line',
            name: `Line ${nodes.length + 1}`,
            attributes: {
              x1: startPoint.x,
              y1: startPoint.y,
              x2: currentPoint.x,
              y2: currentPoint.y,
              stroke: '#38BDF8',
              strokeWidth: 3,
              strokeLinecap: 'round',
            },
            isVisible: true,
            isLocked: false,
          };
        }

        if (newNode) {
          onAddNode(newNode, `Create ${newNode.name}`);
          onSelectNode(newNode.id);
        }
      }

      setDrawingState({
        isDrawing: false,
        startPoint: { x: 0, y: 0 },
        currentPoint: { x: 0, y: 0 },
      });
    }
  };

  // Render SVG Element recursively with animated attributes overlay
  const renderSvgElement = (node: SvgNode): React.ReactElement | null => {
    if (node.isVisible === false) return null;

    // Merge static attributes with real-time keyframe animation attributes
    const attrs = {
      ...node.attributes,
      ...(animatedAttributesMap[node.id] || {}),
    };

    const isSelected = selectedNodeIds.includes(node.id);

    const commonProps = {
      id: node.id,
      fill: attrs.fill || 'none',
      stroke: attrs.stroke || 'none',
      strokeWidth: attrs.strokeWidth !== undefined ? attrs.strokeWidth : 1,
      strokeDasharray: attrs.strokeDasharray,
      strokeLinecap: attrs.strokeLinecap,
      strokeLinejoin: attrs.strokeLinejoin,
      opacity: attrs.opacity !== undefined ? attrs.opacity : 1,
      transform: attrs.transform,
      filter: attrs.filter,
      className: `cursor-pointer transition-opacity ${node.isLocked ? 'pointer-events-none' : ''}`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTool === 'eyedropper') {
          const color = attrs.fill !== 'none' ? attrs.fill : attrs.stroke;
          if (color && onSampleColor) onSampleColor(color);
          return;
        }
        if (activeTool === 'select' || activeTool === 'node') {
          onSelectNode(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
        }
      },
    };

    switch (node.type) {
      case 'rect':
        return (
          <rect
            key={node.id}
            {...commonProps}
            x={attrs.x || 0}
            y={attrs.y || 0}
            width={attrs.width || 100}
            height={attrs.height || 100}
            rx={attrs.rx || 0}
            ry={attrs.ry || 0}
          />
        );
      case 'circle':
        return (
          <circle
            key={node.id}
            {...commonProps}
            cx={attrs.cx || 0}
            cy={attrs.cy || 0}
            r={attrs.r || 50}
          />
        );
      case 'ellipse':
        return (
          <ellipse
            key={node.id}
            {...commonProps}
            cx={attrs.cx || 0}
            cy={attrs.cy || 0}
            rx={attrs.rx || 50}
            ry={attrs.ry || 30}
          />
        );
      case 'line':
        return (
          <line
            key={node.id}
            {...commonProps}
            x1={attrs.x1 || 0}
            y1={attrs.y1 || 0}
            x2={attrs.x2 || 100}
            y2={attrs.y2 || 100}
          />
        );
      case 'polygon':
        return (
          <polygon
            key={node.id}
            {...commonProps}
            points={attrs.points || ''}
          />
        );
      case 'path':
        return (
          <path
            key={node.id}
            {...commonProps}
            d={attrs.d || ''}
          />
        );
      case 'text':
        return (
          <text
            key={node.id}
            {...commonProps}
            x={attrs.x || 0}
            y={attrs.y || 0}
            fontSize={attrs.fontSize || 16}
            fontFamily={attrs.fontFamily || 'sans-serif'}
            fontWeight={attrs.fontWeight || 'normal'}
            textAnchor={attrs.textAnchor || 'start'}
          >
            {attrs.textContent || ''}
          </text>
        );
      case 'g':
        return (
          <g key={node.id} {...commonProps}>
            {(node.children || []).map(child => renderSvgElement(child))}
          </g>
        );
      default:
        return null;
    }
  };

  // Calculate bounding box for selected node to render transform gizmo
  const selectedNode = selectedNodeIds.length === 1 ? nodes.find(n => n.id === selectedNodeIds[0]) : null;
  const getSelectedBoundingBox = () => {
    if (!selectedNode || selectedNode.isLocked) return null;
    const attrs = selectedNode.attributes;

    let minX = 0, minY = 0, width = 100, height = 100;
    if (selectedNode.type === 'rect') {
      minX = attrs.x || 0;
      minY = attrs.y || 0;
      width = attrs.width || 50;
      height = attrs.height || 50;
    } else if (selectedNode.type === 'circle') {
      const cx = attrs.cx || 0;
      const cy = attrs.cy || 0;
      const r = attrs.r || 50;
      minX = cx - r;
      minY = cy - r;
      width = r * 2;
      height = r * 2;
    } else if (selectedNode.type === 'text') {
      minX = attrs.x || 0;
      minY = (attrs.y || 0) - (attrs.fontSize || 20);
      width = (attrs.textContent?.length || 5) * ((attrs.fontSize || 20) * 0.6);
      height = (attrs.fontSize || 20) * 1.2;
    } else if (attrs.x !== undefined && attrs.width !== undefined) {
      minX = attrs.x;
      minY = attrs.y || 0;
      width = attrs.width;
      height = attrs.height || 100;
    } else if (attrs.d) {
      // Approximate path bounds from numbers in d string
      const nums = attrs.d.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
      if (nums.length >= 2) {
        const xs = nums.filter((_, i) => i % 2 === 0);
        const ys = nums.filter((_, i) => i % 2 === 1);
        minX = Math.min(...xs);
        minY = Math.min(...ys);
        width = Math.max(10, Math.max(...xs) - minX);
        height = Math.max(10, Math.max(...ys) - minY);
      }
    }

    return { minX, minY, width, height };
  };

  const bbox = getSelectedBoundingBox();

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative flex-1 h-full w-full bg-[#070B12] overflow-hidden select-none outline-none ${
        spacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* Floating Viewport Navigation Toolbar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#0E1522]/90 backdrop-blur border border-slate-800 p-1 rounded-lg text-slate-300 text-xs shadow-xl">
        <button
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(32, prev.zoom * 1.2) }))}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] px-1.5 tabular-nums text-indigo-400">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset to 100%"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFitToScreen}
          title="Fit Canvas to Viewport"
          className="p-1.5 rounded hover:bg-slate-800 hover:text-white"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />
        <button
          onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
          title="Toggle Grid"
          className={`p-1.5 rounded ${settings.showGrid ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800'}`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
          title="Toggle Snap to Grid"
          className={`p-1.5 rounded ${settings.snapToGrid ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800'}`}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Pan/Zoom Matrix Container */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* Canvas Board Surface */}
        <div
          className={`relative shadow-2xl transition-shadow ${
            settings.showGrid ? 'canvas-grid-dots' : ''
          }`}
          style={{
            width: settings.width,
            height: settings.height,
            backgroundColor: settings.background || '#0B0F17',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${settings.width} ${settings.height}`}
            width={settings.width}
            height={settings.height}
            className="overflow-visible"
          >
            {/* Render all Document SvgNodes */}
            {nodes.map(node => renderSvgElement(node))}

            {/* In-Progress Pen Tool Drawing Path */}
            {activeTool === 'pen' && penPoints.length > 0 && (
              <g className="pointer-events-none">
                <path
                  d={`M ${penPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {penPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === 0 ? 5 : 4}
                    fill={i === 0 ? '#38BDF8' : '#ffffff'}
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            )}

            {/* In-Progress Shape Drawing Preview */}
            {drawingState.isDrawing && (
              <g className="pointer-events-none opacity-80">
                {activeTool === 'rect' && (
                  <rect
                    x={Math.min(drawingState.startPoint.x, drawingState.currentPoint.x)}
                    y={Math.min(drawingState.startPoint.y, drawingState.currentPoint.y)}
                    width={Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x)}
                    height={Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y)}
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="#6366F1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}
                {activeTool === 'circle' && (
                  <ellipse
                    cx={(drawingState.startPoint.x + drawingState.currentPoint.x) / 2}
                    cy={(drawingState.startPoint.y + drawingState.currentPoint.y) / 2}
                    rx={Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x) / 2}
                    ry={Math.abs(drawingState.currentPoint.y - drawingState.startPoint.y) / 2}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="#06B6D4"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}
                {activeTool === 'line' && (
                  <line
                    x1={drawingState.startPoint.x}
                    y1={drawingState.startPoint.y}
                    x2={drawingState.currentPoint.x}
                    y2={drawingState.currentPoint.y}
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}
              </g>
            )}

            {/* Transform Selection Bounding Box Gizmo */}
            {activeTool === 'select' && bbox && (
              <g className="selection-gizmo pointer-events-auto">
                {/* Bounding box outline */}
                <rect
                  x={bbox.minX}
                  y={bbox.minY}
                  width={bbox.width}
                  height={bbox.height}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth={1.5 / viewport.zoom}
                  strokeDasharray={`${4 / viewport.zoom} ${4 / viewport.zoom}`}
                  className="cursor-move"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const pt = getCanvasPoint(e);
                    setTransformDrag({
                      active: true,
                      handle: 'move',
                      startPoint: pt,
                      initialAttrs: { ...selectedNode?.attributes },
                    });
                  }}
                />

                {/* 4 Corner Resize Handles */}
                {['tl', 'tr', 'br', 'bl'].map((corner) => {
                  const cx = corner.includes('r') ? bbox.minX + bbox.width : bbox.minX;
                  const cy = corner.includes('b') ? bbox.minY + bbox.height : bbox.minY;
                  const size = 8 / viewport.zoom;
                  return (
                    <rect
                      key={corner}
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      fill="#FFFFFF"
                      stroke="#6366F1"
                      strokeWidth={1.5 / viewport.zoom}
                      className="cursor-nwse-resize hover:scale-125 transition-transform"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const pt = getCanvasPoint(e);
                        setTransformDrag({
                          active: true,
                          handle: corner,
                          startPoint: pt,
                          initialAttrs: { ...selectedNode?.attributes },
                        });
                      }}
                    />
                  );
                })}

                {/* Top Rotation Handle */}
                <g>
                  <line
                    x1={bbox.minX + bbox.width / 2}
                    y1={bbox.minY}
                    x2={bbox.minX + bbox.width / 2}
                    y2={bbox.minY - 20 / viewport.zoom}
                    stroke="#6366F1"
                    strokeWidth={1.2 / viewport.zoom}
                  />
                  <circle
                    cx={bbox.minX + bbox.width / 2}
                    cy={bbox.minY - 20 / viewport.zoom}
                    r={5 / viewport.zoom}
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth={1.2 / viewport.zoom}
                    className="cursor-alias hover:scale-125 transition-transform"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      const pt = getCanvasPoint(e);
                      setTransformDrag({
                        active: true,
                        handle: 'rotate',
                        startPoint: pt,
                        initialAttrs: { ...selectedNode?.attributes },
                      });
                    }}
                  />
                </g>
              </g>
            )}

            {/* Direct Node & Bezier Tangent Handles */}
            {activeTool === 'node' && editingPathNodes.length > 0 && (
              <g className="node-gizmo pointer-events-auto">
                {editingPathNodes.map((pNode, idx) => (
                  <g key={pNode.id}>
                    {/* Tangent line and control handle In */}
                    {pNode.handleIn && (
                      <>
                        <line
                          x1={pNode.x}
                          y1={pNode.y}
                          x2={pNode.handleIn.x}
                          y2={pNode.handleIn.y}
                          stroke="#06B6D4"
                          strokeWidth={1 / viewport.zoom}
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={pNode.handleIn.x}
                          cy={pNode.handleIn.y}
                          r={4 / viewport.zoom}
                          fill="#06B6D4"
                          stroke="#FFFFFF"
                          strokeWidth={1 / viewport.zoom}
                          className="cursor-crosshair"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingNodeIndex({ index: idx, handleType: 'in' });
                          }}
                        />
                      </>
                    )}

                    {/* Tangent line and control handle Out */}
                    {pNode.handleOut && (
                      <>
                        <line
                          x1={pNode.x}
                          y1={pNode.y}
                          x2={pNode.handleOut.x}
                          y2={pNode.handleOut.y}
                          stroke="#06B6D4"
                          strokeWidth={1 / viewport.zoom}
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={pNode.handleOut.x}
                          cy={pNode.handleOut.y}
                          r={4 / viewport.zoom}
                          fill="#06B6D4"
                          stroke="#FFFFFF"
                          strokeWidth={1 / viewport.zoom}
                          className="cursor-crosshair"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setDraggingNodeIndex({ index: idx, handleType: 'out' });
                          }}
                        />
                      </>
                    )}

                    {/* Main Anchor Vertex Node */}
                    <circle
                      cx={pNode.x}
                      cy={pNode.y}
                      r={5 / viewport.zoom}
                      fill="#6366F1"
                      stroke="#FFFFFF"
                      strokeWidth={1.5 / viewport.zoom}
                      className="cursor-move hover:scale-125 transition-transform"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setDraggingNodeIndex({ index: idx, handleType: 'anchor' });
                      }}
                    />
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
