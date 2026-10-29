# Vector Studio — Architectural Design Document

## 1. System Topology & Philosophy
Vector Studio is an open-standard, cross-platform vector illustration and motion graphics environment engineered around a single unified TypeScript codebase. It eliminates the boundary between visual design tools and code-driven SVG manipulation by maintaining a deterministic, bidirectional Virtual SVG AST (Abstract Syntax Tree).

```
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
```

---

## 2. Core Architectural Pillars

### A. The Virtual SVG AST Pipeline
Rather than directly querying or modifying mutable DOM nodes, Vector Studio manages an immutable tree of `SvgNode` objects:
```typescript
interface SvgNode {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'line' | 'text' | 'g';
  name: string;
  attributes: SvgElementAttributes;
  children?: SvgNode[];
  isLocked?: boolean;
  isVisible?: boolean;
}
```
- **Serialization**: `nodesToSvgString(nodes, canvasSettings)` transforms the AST into clean, standard SVG markup.
- **Deserialization**: `svgStringToNodes(svgString)` uses a sandboxed DOMParser to extract elements, viewBox bounds, and styling into the AST.
- **Reconciliation**: When visual tools mutate elements, the AST updates instantly, emitting debounced snapshots to history and reflecting in the XML editor.

### B. Live Bidirectional XML Synchronization
The editor supports three simultaneous viewing modes:
1. **Studio Canvas (`canvas`)**: Visual direct manipulation maximizing artboard space.
2. **Split XML (`split`)**: Dual-pane workspace with live canvas on the left and interactive XML source code editor on the right.
3. **XML Source (`code`)**: Full-screen distraction-free code editor with line numbers and instant validation.

Edits made in XML mode are verified via a strict `DOMParser` check. If syntax errors exist, a non-blocking error badge is displayed without breaking the canvas. When valid, changes compile directly back into `SvgNode` trees.

### C. Motion Graphics & Interpolation Engine
The animation subsystem operates independently from browser CSS animation during design time to provide true frame-by-frame scrub capability:
- **Timeline Engine**: Driven by `requestAnimationFrame`, interpolating values at timestamp $T$ against neighboring keyframes.
- **Property Tweening**: Handles continuous numbers (X, Y, Width, Height, Opacity, Rotation), hex colors (RGB linear color blending), and SVG path morphing.
- **Easing Math**: Supports mathematical curves including Linear, Ease-In ($t^2$), Ease-Out, Ease-In-Out, Spring bounce, and Cubic Bezier curves.
- **Standalone Export**: When exported with animation enabled, Vector Studio compiles the keyframe tracks into standalone CSS `@keyframes` embedded directly within the SVG `<style>` tag for native browser playback without external JavaScript.

### D. Snapshot History & Undo/Redo Machine
- Encapsulated within `HistoryManager` (`src/utils/history.ts`).
- Maintains an immutable stack of snapshots capturing:
  - Deep-cloned node tree
  - Active selection IDs
  - Action label (e.g. "Draw Rectangle", "Modify Path Bezier Node", "Apply XML Source Edit")
  - Timestamp
- Bounded depth (up to 60 snapshots) with automatic redo invalidation on new actions.
- Global keyboard integration (`Ctrl/Cmd+Z` and `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z`).

### E. Extensible Plugin Architecture
Vector Studio features a plugin system (`src/plugins/index.ts`) allowing runtime injection of:
- **Custom Tools**: Registered tools with `onPointerDown`, `onPointerMove`, and `onPointerUp` hooks receiving `PluginContext` (e.g. Logarithmic Spiral Tool, Sine Wave Ribbon).
- **Appearance & Filter Effects**: Custom shader/filter mutations with configurable UI parameter schemas (e.g. Cyber Neon Glow, Color Inversion, Organic Path Jitter).
- **Platform Exporters**: Output generators converting the document into third-party code formats (e.g. React Native TSX components, CSS Data-URIs).

### F. Gemini 3.8 Flash Assistant Server Proxy
All AI generative capabilities communicate through an Express backend route (`/api/gemini/generate-vector` and `/api/gemini/optimize-svg`):
- Uses `@google/genai` TypeScript SDK.
- Configured with `gemini-3.8-flash` and `ThinkingLevel.HIGH`.
- Server-side key isolation keeping API keys strictly private.
- Extracts SVG markup from markdown fences and validates well-formedness before responding to the client.

---

## 3. Automated Build & Distribution Pipeline
On every production compilation (`npm run build`):
1. **Vite Compilation**: Compiles the React + TypeScript frontend into `/dist`.
2. **Version Incrementor**: Reads the active project release version (starting at `1.0.0-genesis`), parses semver tags, and increments the release counter.
3. **Distribution Packager**: Copies the compiled web application bundle, documentation artifacts (`Components.md`, `Architecture.md`, `Documentation.md`), and distribution manifest into `/distribution/{major.minor.release-codename}`.
