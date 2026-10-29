import { SvgNode, SvgElementType, SvgElementAttributes, CanvasSettings } from '../types/editor';
import { jsPDF } from 'jspdf';

// Unique ID generator
export function generateId(prefix = 'el'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

// Convert SvgNode tree to well-formatted SVG string
export function nodesToSvgString(nodes: SvgNode[], canvas: CanvasSettings, options: { standalone?: boolean; minify?: boolean } = {}): string {
  const { standalone = true, minify = false } = options;
  const indent = minify ? '' : '  ';
  const newline = minify ? '' : '\n';

  function serializeNode(node: SvgNode, depth = 1): string {
    if (node.isVisible === false) return '';
    const pad = minify ? '' : indent.repeat(depth);
    const attrs = { ...node.attributes };

    // Format attributes
    const attrPairs: string[] = [];
    if (node.id) attrPairs.push(`id="${node.id}"`);

    // Basic attributes
    if (attrs.x !== undefined) attrPairs.push(`x="${attrs.x}"`);
    if (attrs.y !== undefined) attrPairs.push(`y="${attrs.y}"`);
    if (attrs.width !== undefined) attrPairs.push(`width="${attrs.width}"`);
    if (attrs.height !== undefined) attrPairs.push(`height="${attrs.height}"`);
    if (attrs.cx !== undefined) attrPairs.push(`cx="${attrs.cx}"`);
    if (attrs.cy !== undefined) attrPairs.push(`cy="${attrs.cy}"`);
    if (attrs.r !== undefined) attrPairs.push(`r="${attrs.r}"`);
    if (attrs.rx !== undefined) attrPairs.push(`rx="${attrs.rx}"`);
    if (attrs.ry !== undefined) attrPairs.push(`ry="${attrs.ry}"`);
    if (attrs.x1 !== undefined) attrPairs.push(`x1="${attrs.x1}"`);
    if (attrs.y1 !== undefined) attrPairs.push(`y1="${attrs.y1}"`);
    if (attrs.x2 !== undefined) attrPairs.push(`x2="${attrs.x2}"`);
    if (attrs.y2 !== undefined) attrPairs.push(`y2="${attrs.y2}"`);
    if (attrs.points) attrPairs.push(`points="${attrs.points}"`);
    if (attrs.d) attrPairs.push(`d="${attrs.d}"`);

    // Style attributes
    if (attrs.fill) attrPairs.push(`fill="${attrs.fill}"`);
    if (attrs.stroke) attrPairs.push(`stroke="${attrs.stroke}"`);
    if (attrs.strokeWidth !== undefined) attrPairs.push(`stroke-width="${attrs.strokeWidth}"`);
    if (attrs.strokeDasharray) attrPairs.push(`stroke-dasharray="${attrs.strokeDasharray}"`);
    if (attrs.strokeLinecap) attrPairs.push(`stroke-linecap="${attrs.strokeLinecap}"`);
    if (attrs.strokeLinejoin) attrPairs.push(`stroke-linejoin="${attrs.strokeLinejoin}"`);
    if (attrs.opacity !== undefined && attrs.opacity !== 1) attrPairs.push(`opacity="${attrs.opacity}"`);

    // Transforms
    let transformStr = attrs.transform || '';
    if (attrs.rotation) {
      const cx = (attrs.x || attrs.cx || 0) + (attrs.width ? attrs.width / 2 : 0);
      const cy = (attrs.y || attrs.cy || 0) + (attrs.height ? attrs.height / 2 : 0);
      transformStr += ` rotate(${attrs.rotation} ${cx} ${cy})`;
    }
    if (transformStr.trim()) {
      attrPairs.push(`transform="${transformStr.trim()}"`);
    }

    if (attrs.filter) attrPairs.push(`filter="${attrs.filter}"`);

    // Text specific
    if (node.type === 'text') {
      if (attrs.fontSize) attrPairs.push(`font-size="${attrs.fontSize}"`);
      if (attrs.fontFamily) attrPairs.push(`font-family="${attrs.fontFamily}"`);
      if (attrs.fontWeight) attrPairs.push(`font-weight="${attrs.fontWeight}"`);
      if (attrs.textAnchor) attrPairs.push(`text-anchor="${attrs.textAnchor}"`);
    }

    const attrString = attrPairs.length ? ' ' + attrPairs.join(' ') : '';

    if (node.type === 'g' || (node.children && node.children.length > 0)) {
      const childrenStr = (node.children || [])
        .map(child => serializeNode(child, depth + 1))
        .filter(Boolean)
        .join(newline);
      return `${pad}<g${attrString}>${newline}${childrenStr}${newline}${pad}</g>`;
    }

    if (node.type === 'text') {
      const text = attrs.textContent || 'Text';
      return `${pad}<text${attrString}>${text}</text>`;
    }

    return `${pad}<${node.type}${attrString} />`;
  }

  const innerSvg = nodes.map(n => serializeNode(n, 1)).filter(Boolean).join(newline);

  if (!standalone) {
    return innerSvg;
  }

  const bgRect = canvas.background && canvas.background !== 'transparent'
    ? `${indent}<rect width="${canvas.width}" height="${canvas.height}" fill="${canvas.background}" />${newline}`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">${newline}${bgRect}${innerSvg}${newline}</svg>`;
}

// Parse SVG XML string into SvgNode array
export function svgStringToNodes(svgString: string): { nodes: SvgNode[]; canvasSettings?: Partial<CanvasSettings> } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(parserError.textContent || 'XML Parsing error');
    }

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No root <svg> element found');
    }

    const canvasSettings: Partial<CanvasSettings> = {};
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        canvasSettings.width = parts[2];
        canvasSettings.height = parts[3];
      }
    } else {
      const width = parseFloat(svgElement.getAttribute('width') || '800');
      const height = parseFloat(svgElement.getAttribute('height') || '600');
      if (!isNaN(width)) canvasSettings.width = width;
      if (!isNaN(height)) canvasSettings.height = height;
    }

    function parseElement(el: Element): SvgNode | null {
      const tagName = el.tagName.toLowerCase();
      const validTypes: SvgElementType[] = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'line', 'text', 'g'];

      let nodeType: SvgElementType = 'path';
      if (validTypes.includes(tagName as SvgElementType)) {
        nodeType = tagName as SvgElementType;
      } else if (tagName === 'polyline') {
        nodeType = 'polygon';
      } else {
        return null;
      }

      const id = el.getAttribute('id') || generateId(nodeType);
      const name = el.getAttribute('data-name') || el.getAttribute('id') || `${nodeType.toUpperCase()}`;

      const attrs: SvgElementAttributes = {};

      // Standard attributes
      if (el.hasAttribute('x')) attrs.x = parseFloat(el.getAttribute('x') || '0');
      if (el.hasAttribute('y')) attrs.y = parseFloat(el.getAttribute('y') || '0');
      if (el.hasAttribute('width')) attrs.width = parseFloat(el.getAttribute('width') || '100');
      if (el.hasAttribute('height')) attrs.height = parseFloat(el.getAttribute('height') || '100');
      if (el.hasAttribute('cx')) attrs.cx = parseFloat(el.getAttribute('cx') || '0');
      if (el.hasAttribute('cy')) attrs.cy = parseFloat(el.getAttribute('cy') || '0');
      if (el.hasAttribute('r')) attrs.r = parseFloat(el.getAttribute('r') || '50');
      if (el.hasAttribute('rx')) attrs.rx = parseFloat(el.getAttribute('rx') || '0');
      if (el.hasAttribute('ry')) attrs.ry = parseFloat(el.getAttribute('ry') || '0');
      if (el.hasAttribute('x1')) attrs.x1 = parseFloat(el.getAttribute('x1') || '0');
      if (el.hasAttribute('y1')) attrs.y1 = parseFloat(el.getAttribute('y1') || '0');
      if (el.hasAttribute('x2')) attrs.x2 = parseFloat(el.getAttribute('x2') || '100');
      if (el.hasAttribute('y2')) attrs.y2 = parseFloat(el.getAttribute('y2') || '100');
      if (el.hasAttribute('points')) attrs.points = el.getAttribute('points') || '';
      if (el.hasAttribute('d')) attrs.d = el.getAttribute('d') || '';

      // Styling attributes
      if (el.hasAttribute('fill')) attrs.fill = el.getAttribute('fill') || 'none';
      if (el.hasAttribute('stroke')) attrs.stroke = el.getAttribute('stroke') || 'none';
      if (el.hasAttribute('stroke-width')) attrs.strokeWidth = parseFloat(el.getAttribute('stroke-width') || '1');
      if (el.hasAttribute('stroke-dasharray')) attrs.strokeDasharray = el.getAttribute('stroke-dasharray') || '';
      if (el.hasAttribute('stroke-linecap')) attrs.strokeLinecap = el.getAttribute('stroke-linecap') as any;
      if (el.hasAttribute('stroke-linejoin')) attrs.strokeLinejoin = el.getAttribute('stroke-linejoin') as any;
      if (el.hasAttribute('opacity')) attrs.opacity = parseFloat(el.getAttribute('opacity') || '1');
      if (el.hasAttribute('transform')) attrs.transform = el.getAttribute('transform') || '';

      // Text attributes
      if (nodeType === 'text') {
        attrs.textContent = el.textContent || '';
        if (el.hasAttribute('font-size')) attrs.fontSize = parseFloat(el.getAttribute('font-size') || '16');
        if (el.hasAttribute('font-family')) attrs.fontFamily = el.getAttribute('font-family') || 'sans-serif';
        if (el.hasAttribute('font-weight')) attrs.fontWeight = el.getAttribute('font-weight') || 'normal';
        if (el.hasAttribute('text-anchor')) attrs.textAnchor = el.getAttribute('text-anchor') as any;
      }

      // Default colors if unspecified
      if (!attrs.fill && !attrs.stroke) {
        attrs.fill = '#6366F1';
      }

      const node: SvgNode = {
        id,
        type: nodeType,
        name,
        attributes: attrs,
        isVisible: true,
        isLocked: false,
      };

      if (nodeType === 'g') {
        const children: SvgNode[] = [];
        Array.from(el.children).forEach(childEl => {
          const parsedChild = parseElement(childEl);
          if (parsedChild) children.push(parsedChild);
        });
        node.children = children;
      }

      return node;
    }

    const nodes: SvgNode[] = [];
    Array.from(svgElement.children).forEach(childEl => {
      // Skip defs or background rect that matches full size if user prefers
      if (childEl.tagName.toLowerCase() === 'defs' || childEl.tagName.toLowerCase() === 'style') {
        return;
      }
      const parsed = parseElement(childEl);
      if (parsed) nodes.push(parsed);
    });

    return { nodes, canvasSettings };
  } catch (error: any) {
    console.error('Error parsing SVG:', error);
    throw error;
  }
}

// High-resolution PNG export via Offscreen Canvas / Image
export async function exportToPng(
  svgString: string,
  width: number,
  height: number,
  scale: number = 2,
  background?: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not supported'));
      return;
    }

    if (background && background !== 'transparent') {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate PNG blob'));
        }
      }, 'image/png');
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image: ' + e));
    };

    img.src = url;
  });
}

// Vector PDF Export using jsPDF
export async function exportToPdf(
  svgString: string,
  width: number,
  height: number,
  title: string = 'vectura_export'
): Promise<Blob> {
  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [width, height],
  });

  // Convert SVG to high-res image and insert into PDF
  const pngBlob = await exportToPng(svgString, width, height, 3, '#ffffff');
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = reader.result as string;
      pdf.addImage(base64data, 'PNG', 0, 0, width, height, undefined, 'FAST');
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    };
    reader.onerror = () => reject(new Error('Failed to read PNG for PDF export'));
    reader.readAsDataURL(pngBlob);
  });
}

// Helper to trigger browser download
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
