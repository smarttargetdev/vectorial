# Vector Studio — Component Technical Reference

## Overview
Vector Studio is built with modular, highly composable React 19 functional components engineered for cross-platform rendering (Web, Desktop Electron/Tauri, Mobile PWA/WebView/React Native). This document describes the props, internal state, lifecycle, and event contracts for every component in the studio.

---

## 1. App (\`src/App.tsx\`)
The root application component orchestrating global studio state, document tree, snapshot history, active tool, view mode, timeline animation, and modal dialogs.

### State & Stores:
- \`doc: ProjectDocument\`: Central document model containing canvas dimensions, background, root vector nodes (\`rootNodes\`), and motion timeline keyframes.
- \`selectedNodeIds: string[]\`: IDs of currently selected elements on canvas and layer tree.
- \`activeTool: ToolType | string\`: Currently selected tool (\`'select' | 'node' | 'pen' | 'rect' | 'circle' | 'polygon' | 'star' | 'line' | 'text' | 'eyedropper'\` or custom plugin tool ID).
- \`viewMode: ViewMode\`: Layout mode (\`'canvas' | 'split' | 'code'\`).
- \`platform: PlatformPreset\`: Active viewport simulation preset (\`'web' | 'macos' | 'windows' | 'linux' | 'ios' | 'android'\`).
- \`historyRef: React.MutableRefObject<HistoryManager>\`: Snapshot undo/redo engine holding state stack.
- \`toast\`: Ephemeral user notification system.

### Key Handlers:
- \`updateNodes(newNodes, actionDesc, forceSnapshot)\`: Mutates node tree and records undo history.
- \`handleUpdateNode(id, updates, actionDesc)\`: Surgically updates attributes or properties of an element.
- \`handleDeleteSelected()\`, \`handleDuplicateSelected()\`: Batch element manipulation.
- \`handleGroupSelected()\`, \`handleUngroupSelected()\`: Groups elements into \`<g>\` containers or un-nests children.
- \`handleUndo()\`, \`handleRedo()\`: Reverts or advances document state with keyboard shortcut support (\`Ctrl+Z\`, \`Ctrl+Y\`).
- \`handleAddKeyframe(elementId, property, value, easing)\`: Inserts animation keyframe at current scrub playhead.

---

## 2. Header (\`src/components/Header.tsx\`)
Top application navigation bar enforcing the strict 3-zone Top Bar Contract.

### Props:
- \`document: ProjectDocument\`: Document title and metadata.
- \`viewMode: ViewMode\`: Current view mode.
- \`setViewMode: (mode: ViewMode) => void\`: View mode setter.
- \`platform: PlatformPreset\`: Active simulated platform.
- \`setPlatform: (p: PlatformPreset) => void\`: Platform preset setter.
- \`canUndo: boolean\`, \`canRedo: boolean\`: Undo/redo stack readiness.
- \`undoAction: string | null\`, \`redoAction: string | null\`: Action tooltips.
- \`onUndo: () => void\`, \`onRedo: () => void\`: Undo/redo dispatch.
- \`onNewDocument\`, \`onOpenSvgFile\`, \`onSaveProject\`, \`onLoadSample\`: File menu handlers.
- \`onOpenExportModal\`, \`onOpenAiModal\`, \`onOpenPluginModal\`: Modal triggers.
- \`onOpenHelpDoc: (tab: 'documentation' | 'architecture' | 'components') => void\`: Opens documentation modal.
- \`onOpenAbout: () => void\`: Opens About screen.

---

## 3. Canvas (\`src/components/Canvas.tsx\`)
The central interactive vector rendering and manipulation canvas.

### Features:
- **Infinite Pan & Zoom**: Smooth mouse wheel zooming (10% to 3200%), keyboard spacebar pan, middle-click pan, and screen-fit calculation.
- **Interactive Transform Gizmo**: 8-point corner and edge resize handles, bounding box translation, and 360-degree rotation handle with instant visual feedback.
- **Direct Node & Bezier Tangent Manipulator**: Parses SVG path \`d\` attribute into anchor vertices and cubic/quadratic bezier control handles (\`handleIn\`, \`handleOut\`) with real-time curve deformation.
- **Shape Drafters**: Live click-and-drag drawing for rectangles, circles, ellipses, regular polygons, 5-point stars, and line segments.
- **Pen Tool**: Sequential anchor placement with path closing detection (\`Z\`).
- **Snapping & Grid System**: Dot-matrix grid guide with configurable snapping threshold.
- **Eyedropper**: One-click color sampling from rendered SVG elements.

---

## 4. LeftDock (\`src/components/LeftDock.tsx\`)
Left floating panel housing the vector tool palette and recursive document layer tree.

### Sub-Sections:
- **Vector Tools Grid**: Quick-access buttons with keyboard shortcuts (\`V\`, \`A\`, \`P\`, \`R\`, \`O\`, \`T\`, \`I\`).
- **Plugin Tools**: Dynamically rendered buttons for registered plugin tools (e.g. Logarithmic Spiral, Sine Wave Ribbon).
- **Document Layer Hierarchy Tree**:
  - Tree node rendering with type badges (\`path\`, \`rect\`, \`circle\`, \`g\`, etc.).
  - Double-click inline layer renaming.
  - Quick visibility toggle (\`Eye\` / \`EyeOff\`).
  - Layer lock toggle (\`Lock\` / \`Unlock\`).
  - Z-Index reordering buttons (\`Move Up\`, \`Move Down\`, \`Bring to Front\`, \`Send to Back\`).
  - Grouping / Ungrouping actions.
  - Search / layer filtering bar.

---

## 5. RightDock (\`src/components/RightDock.tsx\`)
Right inspector dock providing numerical and visual control over vector properties.

### Sub-Sections:
- **Alignment Toolbar**: Align Left, Horizontal Center, Right, Top, Vertical Middle, Bottom.
- **Transform & Bounds**: X, Y coordinates, Width, Height, Rotation angle, Opacity slider, and Aspect Ratio lock toggle.
- **Fill Color & Swatches**: HTML5 color picker, hex code input, transparency toggle, and quick palette swatches.
- **Stroke & Border**: Stroke color, width slider, linecap selector (\`butt\`, \`round\`, \`square\`), and dash array input.
- **Text Properties**: Font size, font weight, and text content editor (visible when text is selected).
- **Artboard Settings**: Canvas dimensions (with standard presets 800×600, 1080×1080, 512×512, 1920×1080) and background fill.
- **Plugin Effects Rack**: Configurable effect parameters for active plugins (e.g. Cyber Neon Glow, Color Inversion, Organic Path Jitter).

---

## 6. XmlEditorPane (\`src/components/XmlEditorPane.tsx\`)
Live bidirectional SVG XML source editor.

### Features:
- Monospace editor with line numbers.
- Live DOMParser syntax validation with error notification banner.
- "Format / Prettify" indentation reformatter.
- One-click clipboard copy.
- "Apply to Canvas" synchronization with automatic AST parsing into \`SvgNode[]\`.

---

## 7. Timeline (\`src/components/Timeline.tsx\`)
Motion graphics keyframe animator and sequencer.

### Features:
- 60 FPS requestAnimationFrame playback loop with loop/ping-pong toggles.
- Real-time scrub playhead needle with time readout (\`mm:ss.SS\`).
- Diamond keyframe indicators positioned across track timelines.
- Keyframe property tweener supporting X, Y, Width, Height, Rotation, Opacity, Fill, Stroke, StrokeWidth.
- Interpolation easing selection: Linear, Ease-In, Ease-Out, Ease-In-Out, Spring Bounce.
- Keyframe dragging to adjust timestamps directly on tracks.

---

## 8. AiAssistantModal (\`src/components/AiAssistantModal.tsx\`)
Modal dialog powered by Gemini 3.8 Flash (\`gemini-3.8-flash\`) with high thinking level.

### Capabilities:
- Natural language prompt to production-grade SVG artwork.
- Selection enhancement and path mathematical expansion.
- SVG cleanup and path coordinate minification.
- Live SVG visual preview and raw XML markup tabs.
- One-click insertion into the canvas layer tree.

---

## 9. ExportModal (\`src/components/ExportModal.tsx\`)
Multi-format production exporter.

### Supported Outputs:
- **Vector SVG**: Clean SVG or Standalone Animated SVG with embedded CSS keyframes.
- **Raster PNG**: Configurable resolution scale (1x, 2x, 4x, 8x) with transparent or solid background.
- **Vector PDF**: Crisp print-ready PDF generated via \`jspdf\`.
- **React Native Component (\`.tsx\`)**: Production-ready \`react-native-svg\` TypeScript component.
- **CSS Data-URI (\`.css\`)**: Background image URL ready for stylesheets.

---

## 10. PluginManagerModal (\`src/components/PluginManagerModal.tsx\`)
Extensible architecture manager to inspect and toggle active plugins.

---

## 11. DocsModal (\`src/components/DocsModal.tsx\`)
In-app interactive documentation reader displaying \`Documentation.md\`, \`Architecture.md\`, and \`Components.md\` with search and navigation.

---

## 12. AboutModal (\`src/components/AboutModal.tsx\`)
Modal dialog presenting software information, build release codename, keyboard shortcuts cheatsheet, and cross-platform architecture specifications.
