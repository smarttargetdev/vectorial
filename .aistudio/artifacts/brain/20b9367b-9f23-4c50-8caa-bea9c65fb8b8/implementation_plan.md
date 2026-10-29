# Vectura Studio: Cross-Platform Vector Illustration & Motion Graphics Suite

Vectura Studio is a professional-grade, cross-platform vector illustration and motion graphics environment engineered for desktop, tablet, and mobile platforms with a single shared codebase. It bridges intuitive visual vector manipulation (paths, bezier nodes, shapes, styling) with real-time bidirectional XML code editing, a comprehensive layer tree hierarchy, an advanced keyframe animation timeline, and multi-format export capabilities (SVG, PDF, high-res PNG).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during the initial consultation:

- **Workspace Layout Confirmed**: Professional studio layout with dual floating docks (left tool palette & document layer hierarchy; right transform, styling, and geometry inspector) paired with an expansive canvas and bottom motion timeline.
- **Motion Animation Scope Confirmed**: Full property keyframing engine supporting transform interpolation (position X/Y, scale, rotation, origin), styling transitions (fill, stroke, stroke-width, opacity), and path morphing across configurable easing curves with real-time scrub & playback.
- **AI Vector Assistant Modal Confirmed**: Seamless modal dialog providing prompt-to-SVG creation, complex path math generation, SVG code minification/optimization, and automated motion choreography powered by `gemini-4-argon` with `ThinkingLevel.HIGH`.
- **Platform Universality Confirmed**: Shared React / React Native for Web architecture supporting Web, macOS, Windows, Linux, Android, and iOS viewport presets with touch and mouse-precision input handlers.

---

## 1. Overview & Core Concept

### What It Does
Vectura Studio provides a complete vector design environment where users can draw, manipulate, organize, code, animate, and export scalable vector graphics:
- **Universal Canvas & Vector Tools**: Select, Direct Node Select (Anchor & Bezier Control Handles), Pen Tool with cubic/quadratic bezier drawing, Shape Tools (Rectangle, Rounded Rect, Ellipse, Polygon, Star, Line), Text Tool, and Eyedropper.
- **Dual Visual & XML Workflow**: Instant bidirectional live synchronization between visual manipulation on the canvas and clean, formatted SVG/XML source code editing with syntax validation and instant diff application.
- **Layer & Document Hierarchy**: Full tree explorer with grouping (`<g>`), layer reordering, lock/unlock, visibility toggles, hierarchy breadcrumbs, and rename capabilities.
- **Motion Graphics & Keyframe Timeline**: Multi-track timeline editor with playhead scrubbing, zoom controls, keyframe insertion across element properties, easing curves (Linear, Ease-In-Out, Spring, Cubic Bezier), and animated SVG/SMIL preview.
- **Studio Export Hub**: High-fidelity export options including standard SVG, cleaned standalone animated SVG, vector PDF documents, and crisp high-resolution PNGs at custom scale factors (1x, 2x, 4x, 8x).

### Target Audience & Persona
- Vector artists, icon designers, UI/UX illustrators, motion designers, and front-end engineers seeking clean SVG source output alongside visual authoring.

### Key Value
Eliminates the friction between visual vector design software and code editors by making the SVG Document Object Model (DOM) directly inspectable, animatable, and editable in real time.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Creation & Drawing**:
   - The user selects a tool (e.g. Pen, Shape, or Text).
   - Drawing directly onto the canvas creates live vector primitives with instant bounding boxes, transform handles, and node points.
   - Adjusting anchor handles in Node Edit mode updates curves smoothly with coordinate snapping and grid guides.
2. **Layer Organization & Inspection**:
   - Elements automatically populate the left Document Tree.
   - Users can drag to reorder z-indices, nest elements inside groups, toggle visibility or lock state, and batch-select elements.
   - The right Inspector provides precise numeric inputs for transforms (X, Y, W, H, Rotation), fills (solid, linear gradients, opacity), stroke dynamics (cap, join, dash arrays), and shadow filters.
3. **Live XML Source Mode**:
   - Users toggle the XML Editor split-dock or full-screen view.
   - Typing or pasting external SVG code immediately reflects on the canvas without state loss; dragging elements on canvas updates the XML code in real time.
4. **Motion Graphics & Keyframing**:
   - Opening the bottom Timeline reveals tracks for each selected layer.
   - Scrubbing the playhead to timestamp $T$ and altering position, color, or scale records keyframe nodes.
   - Clicking Play runs real-time interpolated animation with loop, ping-pong, and FPS toggles.
5. **Export & Sharing**:
   - Clicking Export opens the format selector: SVG (Standard or Animated), PDF (clean vector vector print ready), or PNG (1x to 4x raster resolution).
   - One-click file save downloads the project file (`.vectura` JSON or raw `.svg`) for cross-platform portability.

### Visual Identity & Theme
- **Aesthetic Direction**: Sleek, industrial dark-slate digital workstation inspired by modern creative tooling (Figma, After Effects, and VS Code). Uncluttered, distraction-free surfaces with crisp hairline borders (`rgba(255, 255, 255, 0.08)`).
- **Color Palette**:
  - *Canvas & Background*: Deep obsidian slate (`#0B0F17`) with subtle dot-matrix canvas grid (`#1E293B`).
  - *Structural Docks & Toolbars*: Subdued graphite (`#111827`, `#182234`).
  - *Borders & Dividers*: Ultra-thin hairline dividers (`#1F293D`).
  - *High-Intent Accent*: Vibrant electric indigo (`#6366F1`) and cyan (`#06B6D4`) for active tools, selection bounding boxes, and timeline playheads.
  - *Status & Keyframes*: Emerald (`#10B981`) for saved state, Amber (`#F59E0B`) for keyframe diamonds, Rose (`#F43F5E`) for record mode.
- **Typography & Hierarchy**:
  - *Display / UI Typography*: `Plus Jakarta Sans` for crisp tooltips, button labels, and dock section titles.
  - *Code & Numeric Inputs*: `JetBrains Mono` and `tabular-nums` for precise coordinate inputs, dimension readouts, and XML source code.
- **Zero-Pill Discipline & Anti-Slop**:
  - No static pill capsules or decorative candy tags.
  - Clean typographic separators and segmented toggle controls for tool selections.
  - Compact, high-density inspector rows (32px–36px) maximizing canvas workspace.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Bidirectional SVG Virtual AST vs. Raw String DOM
- **Chosen Approach**: Maintain a structured SVG Node AST state that drives both the visual React SVG rendering pipeline and the synchronized XML text representation.
- **Why**: Allows instant undo/redo, deterministic keyframing, property interpolation, and surgical node editing while preventing parsing race conditions.
- **Alternative Considered**: Editing innerHTML directly causes DOM re-mounts, losing canvas selection state and drag interactions.

### Decision 2: Motion Timeline Interpolation Engine
- **Chosen Approach**: Built-in requestAnimationFrame interpolation engine computing tweened property states between discrete keyframes with cubic bezier easing curves.
- **Why**: Delivers 60fps buttery scrubbing and playback in the canvas, while enabling seamless export to standard CSS `@keyframes` or standalone animated SVG `<animate>` / SMIL tags.
- **Alternative Considered**: CSS-only animations prevent interactive timeline scrubbing and playhead snapping.

### Decision 3: Express Backend Proxy with Gemini 4 Argon High Thinking
- **Chosen Approach**: Server-side proxy (`/api/gemini/generate-vector`) utilizing the official `@google/genai` SDK with `gemini-4-argon` and `ThinkingLevel.HIGH` as requested by user metadata.
- **Why**: Keeps API keys strictly server-side, enables reasoning through complex geometric path math (trigonometry, spiral bezier calculations, shape boolean hints), and ensures resilient error recovery.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Vectura Studio Top Header                       │
│  [Wordmark]  [File: New/Open/Save]  [View: UI / XML / Split]  [Export] │
└────────────────────────────────────────────────────────────────────────┘
┌───────────┬──────────────────────────────────────────────┬─────────────┐
│ Left Dock │               Universal Canvas               │ Right Dock  │
│ ───────── │ ──────────────────────────────────────────── │ ─────────── │
│ Tool Rack │ • Infinite Pan / Zoom Viewport (10% - 3200%) │ Transforms  │
│ • Select  │ • Bounding Box Transform Gizmo               │ • X, Y, W, H│
│ • Node/Pen│ • Interactive Bezier Anchor & Tangent Nodes  │ • Angle, Op.│
│ • Shapes  │ • Rulers, Crosshairs, Alignment Guides       │             │
│ • Text    │ • Multi-touch & Wheel Gesture Navigation     │ Appearance  │
│ ───────── │                                              │ • Fill / Stk│
│ Document  │ ──────────────────────────────────────────── │ • Dash, Cap │
│ Hierarchy │ Live XML Code Split Pane (Optional View)     │ • Corner R  │
│ Tree      │ • Bidirectional Sync & Real-time Formatting  │ • Filters   │
└───────────┴──────────────────────────────────────────────┴─────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│                    Motion Graphics Keyframe Timeline                   │
│ [Play/Pause] [Time: 00:02.40] [Add Keyframe] [Easing: Ease-In-Out]     │
│ ── Track: Path 1  ◇─────────◇───────────────────◇                     │
│ ── Track: Rect 2            ◇──────────────◇                          │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models
- **SvgElement**: `{ id, type, name, attributes: { x, y, width, height, d, fill, stroke, strokeWidth, opacity, rx, transform, ... }, children: SvgElement[], isLocked, isVisible }`
- **Keyframe**: `{ id, elementId, property, timeMs, value, easing }`
- **ProjectDocument**: `{ title, viewBox: { width, height }, elements: SvgElement[], animation: { durationMs, fps, keyframes: Keyframe[] } }`

### Complete Working Capabilities
1. **Interactive Vector Tools**:
   - Standard Select & Transform (move, resize with proportional lock, rotate).
   - Pen & Node Edit tool (click to add anchors, drag to shape cubic beziers, select existing anchor points to reposition tangents).
   - Shape generation: Rectangle, Rounded Rect, Circle/Ellipse, Star (configurable points), Polygon, Line, Path.
2. **Document & Layer Tree**:
   - Drag to reorder layer depth, group (`Ctrl/Cmd+G`), ungroup (`Ctrl/Cmd+Shift+G`), hide/show, lock/unlock.
3. **Properties Inspector**:
   - Exact numerical adjustments, color picker with hex/rgb/presets, stroke widths, dash arrays, corner radius.
4. **Live XML Code Mirror**:
   - Syntax-highlighted SVG XML code editor with instant re-render, error boundary detection, and copy/paste capabilities.
5. **Timeline & Animation Engine**:
   - Record keyframes for properties, scrubber bar, play/pause/loop, easing selector, frame-by-frame stepping.
6. **AI Assistant Modal**:
   - Prompt-based vector generation, natural language path modification, and SVG code optimization powered by `gemini-4-argon` with high thinking level.
7. **Export Hub**:
   - SVG export (formatted code or animated standalone), vector PDF export, and PNG export with 1x, 2x, 4x resolution scaling.
