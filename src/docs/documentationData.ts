export const documentationData = {
  version: '1.0.0-genesis',
  releaseCodename: 'genesis',
  documentation: `# Vector Studio — User Guide & Feature Manual

Welcome to **Vector Studio**, the professional cross-platform vector illustration and motion graphics environment. Vector Studio bridges visual vector artistry with live SVG/XML code manipulation, multi-track animation keyframing, and production-grade export pipelines.

---

## 1. Quick Start Workflow

### A. Creating & Opening Projects
- **New Blank Document**: Click **File > New Document** or press Ctrl+N to reset the canvas.
- **Open Existing SVG**: Click **File > Open SVG File...** to import any .svg from your computer into an editable layer hierarchy.
- **Save Project**: Click **File > Save Project (.vectura)** to download your complete project file including all layers, canvas configurations, and animation keyframes.
- **Sample Projects**: Explore pre-built professional artwork via **File > Sample Projects** (Cyber Pulse Emblem or Solar Orbit Motion).

---

## 2. Vector Tools & Canvas Navigation

| Shortcut | Tool | Description |
| :---: | :--- | :--- |
| **V** | **Select & Transform** | Selects elements. Shows an 8-point bounding box with resize and rotation handles. |
| **A** | **Direct Node Edit** | Selects path anchor vertices and bezier control handles for direct curve deformation. |
| **P** | **Pen Tool** | Click to place path anchors; click first point to close path (Z). |
| **R** | **Rectangle** | Click and drag on canvas to draw rectangles and rounded rects. |
| **O** | **Circle / Ellipse** | Click and drag to create circular and elliptical vectors. |
| **T** | **Text Tool** | Click anywhere on canvas to place editable SVG typography. |
| **I** | **Eyedropper** | Click any rendered vector to sample its fill or stroke color. |
| **Space + Drag** | **Pan Canvas** | Hold Spacebar and drag with mouse to pan infinitely across the canvas. |
| **Ctrl + Wheel** | **Zoom Canvas** | Smoothly zoom between 10% and 3200%. |

---

## 3. Advanced Bezier Node Editing
When the **Node Edit Tool (A)** is active on a vector path:
1. **Anchor Vertices (Blue Circles)**: Drag any vertex to reposition the node in Cartesian space.
2. **Tangent Control Handles (Cyan Diamonds)**: Drag tangent handles (handleIn and handleOut) to alter curve curvature, entry angle, and tension.
3. Path coordinates update in real time with synchronized XML code and undo history.

---

## 4. Live XML Source Mode & Synchronization
Switch seamlessly between visual and code authoring using the header view mode selector:
- **Studio Mode**: Maximizes the canvas area for visual composition.
- **Split XML Mode**: Displays the canvas on the left and the interactive XML source editor on the right.
- **XML Source Mode**: Full-screen code editing with line numbers and syntax validation.
- **Format Code**: Click Format to clean and prettify indentation.
- **Apply to Canvas**: Edits typed into the XML editor validate with DOMParser and compile directly into canvas layers.

---

## 5. Document Layer Hierarchy & Grouping
The left dock houses the **Document Layers** tree:
- **Reordering**: Click and drag or use the Move Up and Move Down buttons to change layer depth.
- **Grouping (Ctrl+G)**: Select multiple layers and click Group to wrap them inside an SVG <g> tag.
- **Ungrouping (Ctrl+Shift+G)**: Select any group and click Ungroup to extract child elements.
- **Locking**: Click the padlock icon to lock layers against accidental clicks or transforms.
- **Visibility**: Click the eye icon to show or hide layers.
- **Renaming**: Double-click any layer name to rename it inline.

---

## 6. Motion Graphics & Keyframe Timeline
Create animated vector sequences with the bottom timeline:
1. **Scrubbing**: Click or drag across the top time ruler to reposition the red playhead.
2. **Adding Keyframes**: Select an element, move the playhead to a timestamp, and click Add Keyframe.
3. **Properties Supported**: Position (X/Y), Dimensions, Rotation, Opacity, Fill Color, Stroke Color, and Stroke Width.
4. **Easing Curves**: Select any keyframe diamond (◇) and choose easing curves:
   - *Ease In-Out* (smooth organic transition)
   - *Linear* (constant velocity)
   - *Spring Bounce* (elastic mechanical settling)
5. **Playback**: Click the Play button or press Spacebar to preview animation at 60 FPS.

---

## 7. Multi-Format Production Exporter
Click the **Export** button in the header to open the export hub:
- **Vector SVG**: Standard clean vector markup or standalone animated SVG with embedded CSS @keyframes.
- **High-Res PNG**: Rasterizes vector artwork at 1x, 2x, 4x, or 8x scale factors with optional transparent background.
- **Vector PDF**: Generates print-ready vector PDF documents via jspdf.
- **React Native Component**: Exports react-native-svg TypeScript JSX components ready for iOS and Android mobile apps.
- **CSS Data-URI**: Exports vector artwork encoded into ready-to-use CSS background rules.

---

## 8. AI Vector Studio (Gemini 3.8 Flash)
Click **AI Vector Studio** to open the generative assistant:
- **Generate Artwork**: Enter a prompt describing desired shapes, colors, or icons.
- **Enhance Canvas**: Modifies or adds complementary geometry to your active selection.
- **Optimize & Clean SVG**: Normalizes coordinates, strips redundant containers, and simplifies paths.
- **Thinking Mode**: Operates with ThinkingLevel.HIGH for deep spatial reasoning and mathematical curve plotting.

---

## 9. Plugin System & Extensibility
Click **Plugins** in the top bar to inspect or toggle registered plugins:
- **Generative Curves & Spiral Tool**: Adds mathematical Archimedean spirals and harmonic sine waves.
- **Cyber Glow Filters**: Adds multi-stage glowing aura and specular drop shadows.
- **Sketch & Jitter Roughen**: Transforms straight lines into architectural hand-drawn sketch paths.
- **React Native Exporter**: Converts SVG trees into React Native components.

---

## 10. Complete Keyboard Shortcuts Cheatsheet

| Shortcut | Action |
| :--- | :--- |
| Ctrl / Cmd + Z | Undo last action |
| Ctrl / Cmd + Y or Shift + Z | Redo action |
| Ctrl / Cmd + D | Duplicate selected element |
| Delete / Backspace | Delete selected element |
| Ctrl / Cmd + G | Group selected elements |
| Ctrl / Cmd + Shift + G | Ungroup container |
| V | Select & Transform tool |
| A | Direct Node & Bezier tool |
| P | Pen tool |
| R | Rectangle tool |
| O | Circle / Ellipse tool |
| T | Text tool |
| I | Eyedropper color picker |
| Space | Play / Pause motion timeline |
`,

  architecture: `# Vector Studio — Architectural Design Document

## 1. System Topology & Philosophy
Vector Studio is an open-standard, cross-platform vector illustration and motion graphics environment engineered around a single unified TypeScript codebase. It eliminates the boundary between visual design tools and code-driven SVG manipulation by maintaining a deterministic, bidirectional Virtual SVG AST (Abstract Syntax Tree).

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│                        Vector Studio Top Bar                           │
│  [Wordmark]  [File / Edit / Plugins / Help]  [Studio | Split | XML]    │
└────────────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────┬──────────────┐
│  Left Dock   │             Universal Canvas             │  Right Dock  │
│ ──────────── │ ──────────────────────────────────────── │ ──────────── │
│ • Tool Rack  │ • Infinite Pan & Zoom Engine             │ • Alignment  │
│   (V,A,P,R..)│ • Transform Bounding Box Gizmo           │ • Transforms │
│ • Plugin     │ • Bezier Vertex & Tangent Manipulator    │ • Fill/Stroke│
│   Tools      │ • Real-Time Primitives Drafter           │ • Text Props │
│ • Document   │                                          │ • Canvas Dim │
│   Layer Tree │ ──────────────────────────────────────── │ • Plugin     │
│   Hierarchy  │ XML Code Editor Pane (Split or Code View)│   Effects    │
└──────────────┴──────────────────────────────────────────┴──────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│                   Motion Graphics Keyframe Timeline                    │
│ [Play/Pause] [00:01.50 / 03.00s] [Keyframe Diamonds ◇] [Easing Selector]│
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 2. Core Architectural Pillars

### A. The Virtual SVG AST Pipeline
Rather than directly querying or modifying mutable DOM nodes, Vector Studio manages an immutable tree of SvgNode objects:
- **Serialization**: nodesToSvgString(nodes, canvasSettings) transforms the AST into clean, standard SVG markup.
- **Deserialization**: svgStringToNodes(svgString) uses a sandboxed DOMParser to extract elements, viewBox bounds, and styling into the AST.
- **Reconciliation**: When visual tools mutate elements, the AST updates instantly, emitting debounced snapshots to history and reflecting in the XML editor.

### B. Live Bidirectional XML Synchronization
The editor supports three simultaneous viewing modes:
1. **Studio Canvas (canvas)**: Visual direct manipulation maximizing artboard space.
2. **Split XML (split)**: Dual-pane workspace with live canvas on the left and interactive XML source code editor on the right.
3. **XML Source (code)**: Full-screen distraction-free code editor with line numbers and instant validation.

### C. Motion Graphics & Interpolation Engine
The animation subsystem operates independently from browser CSS animation during design time to provide true frame-by-frame scrub capability:
- **Timeline Engine**: Driven by requestAnimationFrame, interpolating values at timestamp T against neighboring keyframes.
- **Property Tweening**: Handles continuous numbers (X, Y, Width, Height, Opacity, Rotation), hex colors (RGB linear color blending), and SVG path morphing.
- **Easing Math**: Supports mathematical curves including Linear, Ease-In, Ease-Out, Ease-In-Out, Spring bounce, and Cubic Bezier curves.
- **Standalone Export**: When exported with animation enabled, Vector Studio compiles the keyframe tracks into standalone CSS @keyframes embedded directly within the SVG <style> tag for native browser playback without external JavaScript.

### D. Snapshot History & Undo/Redo Machine
- Encapsulated within HistoryManager (src/utils/history.ts).
- Maintains an immutable stack of snapshots capturing node tree, selection IDs, action labels, and timestamps.
- Bounded depth (up to 60 snapshots) with automatic redo invalidation on new actions.
- Global keyboard integration (Ctrl/Cmd+Z and Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z).

### E. Extensible Plugin Architecture
Vector Studio features a plugin system (src/plugins/index.ts) allowing runtime injection of custom tools, appearance effects, platform exporters, and menu commands.

### F. Gemini 3.8 Flash Assistant Server Proxy
All AI generative capabilities communicate through an Express backend route (/api/gemini/generate-vector and /api/gemini/optimize-svg):
- Uses @google/genai TypeScript SDK with gemini-3.8-flash and ThinkingLevel.HIGH.
- Server-side key isolation keeping API keys strictly private.

---

## 3. Automated Build & Distribution Pipeline
On every production compilation (npm run build):
1. **Vite Compilation**: Compiles the React + TypeScript frontend into /dist.
2. **Version Incrementor**: Reads the active project release version (starting at 1.0.0-genesis), parses semver tags, and increments the release counter.
3. **Distribution Packager**: Copies the compiled web application bundle, documentation artifacts (Components.md, Architecture.md, Documentation.md), and distribution manifest into /distribution/{major.minor.release-codename}.
`,

  components: `# Vector Studio — Component Technical Reference

## Overview
Vector Studio is built with modular, highly composable React 19 functional components engineered for cross-platform rendering. This document describes the props, internal state, lifecycle, and event contracts for every component in the studio.

---

## 1. App (src/App.tsx)
The root application component orchestrating global studio state, document tree, snapshot history, active tool, view mode, timeline animation, and modal dialogs.
- State: doc, selectedNodeIds, activeTool, viewMode, platform, historyRef, toast.
- Handlers: updateNodes, handleUpdateNode, handleDeleteSelected, handleDuplicateSelected, handleGroupSelected, handleUngroupSelected, handleUndo, handleRedo, handleAddKeyframe.

## 2. Header (src/components/Header.tsx)
Top application navigation bar enforcing the strict 3-zone Top Bar Contract.
- Dropdown Menus: File, Edit, Plugins, Help.
- View Mode Selector: Studio, Split XML, XML Source.
- Platform Simulator: Web, macOS, Windows, Linux, iOS, Android.
- Quick Actions: AI Vector Studio, Export.

## 3. Canvas (src/components/Canvas.tsx)
The central interactive vector rendering and manipulation canvas.
- Features: Infinite pan/zoom, 8-point transform bounding box, bezier anchor and tangent manipulators, shape drafters (Rect, Circle, Poly, Star, Line), pen tool, grid snapping, and eyedropper color sampler.

## 4. LeftDock (src/components/LeftDock.tsx)
Left floating panel housing the vector tool palette and recursive document layer tree.
- Sub-Sections: Vector Tools Grid, Plugin Tools, Document Layer Hierarchy Tree with visibility, locking, reordering, inline rename, and grouping.

## 5. RightDock (src/components/RightDock.tsx)
Right inspector dock providing numerical and visual control over vector properties.
- Sub-Sections: Alignment toolbar, Transform & Bounds, Fill Color & Swatches, Stroke & Border styling, Text properties, Artboard settings, and Plugin Effects rack.

## 6. XmlEditorPane (src/components/XmlEditorPane.tsx)
Live bidirectional SVG XML source editor.
- Features: Monospace editor with line numbers, live DOMParser syntax validation, format/prettify button, clipboard copy, and apply to canvas.

## 7. Timeline (src/components/Timeline.tsx)
Motion graphics keyframe animator and sequencer.
- Features: 60 FPS playback loop, scrub playhead needle, diamond keyframe indicators, easing curve selector, and property tracks.

## 8. AiAssistantModal (src/components/AiAssistantModal.tsx)
Modal dialog powered by Gemini 3.8 Flash (gemini-3.8-flash) with high thinking level for generative artwork, selection enhancement, and SVG code optimization.

## 9. ExportModal (src/components/ExportModal.tsx)
Multi-format production exporter supporting clean SVG, standalone animated SVG, high-res PNG (1x-8x), vector PDF, React Native TSX components, and CSS Data-URIs.

## 10. PluginManagerModal (src/components/PluginManagerModal.tsx)
Extensible architecture manager to inspect and toggle installed plugins.

## 11. DocsModal (src/components/DocsModal.tsx)
In-app interactive documentation reader displaying Documentation.md, Architecture.md, and Components.md with search and navigation.

## 12. AboutModal (src/components/AboutModal.tsx)
Modal dialog presenting software information, build release codename (1.0.0-genesis), keyboard shortcuts cheatsheet, and cross-platform architecture specifications.
`
};
