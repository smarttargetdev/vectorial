# Vector Studio — User Guide & Feature Manual

Welcome to **Vector Studio**, the professional cross-platform vector illustration and motion graphics environment. Vector Studio bridges visual vector artistry with live SVG/XML code manipulation, multi-track animation keyframing, and production-grade export pipelines.

---

## 1. Quick Start Workflow

### A. Creating & Opening Projects
- **New Blank Document**: Click **File > New Document** or press `Ctrl+N` to reset the canvas.
- **Open Existing SVG**: Click **File > Open SVG File...** to import any `.svg` from your computer into an editable layer hierarchy.
- **Save Project**: Click **File > Save Project (.vectura)** to download your complete project file including all layers, canvas configurations, and animation keyframes.
- **Sample Projects**: Explore pre-built professional artwork via **File > Sample Projects** (*Cyber Pulse Emblem* or *Solar Orbit Motion*).

---

## 2. Vector Tools & Canvas Navigation

| Shortcut | Tool | Description |
| :---: | :--- | :--- |
| **`V`** | **Select & Transform** | Selects elements. Shows an 8-point bounding box with resize and rotation handles. |
| **`A`** | **Direct Node Edit** | Selects path anchor vertices and bezier control handles for direct curve deformation. |
| **`P`** | **Pen Tool** | Click to place path anchors; click first point to close path (`Z`). |
| **`R`** | **Rectangle** | Click and drag on canvas to draw rectangles and rounded rects. |
| **`O`** | **Circle / Ellipse** | Click and drag to create circular and elliptical vectors. |
| **`T`** | **Text Tool** | Click anywhere on canvas to place editable SVG typography. |
| **`I`** | **Eyedropper** | Click any rendered vector to sample its fill or stroke color. |
| **`Space` + Drag** | **Pan Canvas** | Hold Spacebar and drag with mouse to pan infinitely across the canvas. |
| **`Ctrl` + Wheel** | **Zoom Canvas** | Smoothly zoom between 10% and 3200%. |

---

## 3. Advanced Bezier Node Editing
When the **Node Edit Tool (`A`)** is active on a vector path:
1. **Anchor Vertices (Blue Circles)**: Drag any vertex to reposition the node in Cartesian space.
2. **Tangent Control Handles (Cyan Diamonds)**: Drag tangent handles (`handleIn` and `handleOut`) to alter curve curvature, entry angle, and tension.
3. Path coordinates update in real time with synchronized XML code and undo history.

---

## 4. Live XML Source Mode & Synchronization
Switch seamlessly between visual and code authoring using the header view mode selector:
- **Studio Mode**: Maximizes the canvas area for visual composition.
- **Split XML Mode**: Displays the canvas on the left and the interactive XML source editor on the right.
- **XML Source Mode**: Full-screen code editing with line numbers and syntax validation.
- **Format Code**: Click **Format** to clean and prettify indentation.
- **Apply to Canvas**: Edits typed into the XML editor validate with `DOMParser` and compile directly into canvas layers.

---

## 5. Document Layer Hierarchy & Grouping
The left dock houses the **Document Layers** tree:
- **Reordering**: Click and drag or use the **Move Up** and **Move Down** buttons to change layer depth.
- **Grouping (`Ctrl+G`)**: Select multiple layers and click Group to wrap them inside an SVG `<g>` tag.
- **Ungrouping (`Ctrl+Shift+G`)**: Select any group and click Ungroup to extract child elements.
- **Locking**: Click the padlock icon to lock layers against accidental clicks or transforms.
- **Visibility**: Click the eye icon to show or hide layers.
- **Renaming**: Double-click any layer name to rename it inline.

---

## 6. Motion Graphics & Keyframe Timeline
The bottom timeline enables full vector animation:
- **Timeline Needle**: Scrub anywhere along the timeline bar to preview interpolated frames.
- **Adding Keyframes**: Click the **+ Keyframe** diamond icon next to any property (Position, Scale, Rotation, Opacity, Fill, Path D).
- **Interpolation & Easing**: Select from Linear, Ease In/Out, Elastic, or Bounce curve interpolation.
- **Playback Controls**: Play, pause, loop, and step through frames at 60 FPS.
- **Animated SVG Export**: Exports pure CSS `@keyframes` that run natively in any web browser without external scripts.

---

## 7. Multi-Format Export Options
Click **Export** in the top navigation bar:
- **Standard SVG**: Clean, production-ready vector SVG code.
- **Animated SVG**: Generates self-contained SVG files with embedded CSS keyframe animations.
- **High-Resolution PNG**: Crisp rasterized bitmaps rendered at 1x, 2x, 4x, or 8x scale with transparent or colored backgrounds.
- **Vector PDF**: Multi-resolution vector PDF document generated directly from canvas coordinates.
- **Standalone Android APK**: Bundled Android APK package ready for installation.
- **React Native Component**: Exports `react-native-svg` TypeScript JSX components ready for iOS and Android mobile apps.
- **CSS Data-URI**: Exports vector artwork encoded into ready-to-use CSS background rules.

---

## 8. AI Vector Studio (Gemini 3.8 Flash)
Click **AI Vector Studio** to open the generative assistant:
- **Generate Artwork**: Enter a prompt describing desired shapes, colors, or icons.
- **Enhance Canvas**: Modifies or adds complementary geometry to your active selection.
- **Optimize & Clean SVG**: Normalizes coordinates, strips redundant containers, and simplifies paths.
- **Thinking Mode**: Operates with `ThinkingLevel.HIGH` for deep spatial reasoning and mathematical curve plotting.

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
| `Ctrl` / `Cmd` + `Z` | Undo last action |
| `Ctrl` / `Cmd` + `Y` or `Shift` + `Z` | Redo action |
| `Ctrl` / `Cmd` + `D` | Duplicate selected element |
| `Delete` / `Backspace` | Delete selected element |
| `Ctrl` / `Cmd` + `G` | Group selected elements |
| `Ctrl` / `Cmd` + `Shift` + `G` | Ungroup container |
| `V` | Select & Transform tool |
| `A` | Direct Node & Bezier tool |
| `P` | Pen tool |
| `R` | Rectangle tool |
| `O` | Circle / Ellipse tool |
| `T` | Text tool |
| `I` | Eyedropper color picker |
| `Space` | Play / Pause motion timeline |

---

## 11. Distributions & Standalone Android APK

Every build of Vector Studio produces a persistent release inside `/distribution/{major.minor.release-codename}`:
- **Never Ignored by Git**: Git tracking is explicitly enabled for all distributions via `!/distribution/**` in `.gitignore`.
- **Standalone Android APK**: Bundled with native Android manifest, `classes.dex`, launcher icons, and signed certificates at `/distribution/{version}/android/vector_studio-{version}.apk`.
- **Compiled Web App**: Preserved under `/distribution/{version}/app/`.
- **Technical Documentation Artifacts**: `Components.md`, `Architecture.md`, and `Documentation.md` are copied on every build into `/distribution/{version}/docs/`.
