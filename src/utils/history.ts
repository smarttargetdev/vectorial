import { SvgNode } from '../types/editor';

export interface HistorySnapshot {
  nodes: SvgNode[];
  selectedNodeIds: string[];
  action: string;
  timestamp: number;
}

export class HistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private maxDepth: number = 60;
  private lastSnapshotTime: number = 0;
  private debounceMs: number = 250;

  constructor(initialNodes: SvgNode[] = [], initialSelectedIds: string[] = []) {
    this.undoStack.push({
      nodes: this.deepClone(initialNodes),
      selectedNodeIds: [...initialSelectedIds],
      action: 'Initial Document',
      timestamp: Date.now(),
    });
  }

  // Deep clone helper
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Push new action to history
  public push(nodes: SvgNode[], selectedNodeIds: string[], action: string = 'Edit', force: boolean = false): void {
    const now = Date.now();
    // Debounce rapid continuous inputs (e.g. color slider dragging or fast typing) unless forced
    if (!force && now - this.lastSnapshotTime < this.debounceMs && this.undoStack.length > 1) {
      // Overwrite the most recent snapshot for fluid dragging
      this.undoStack[this.undoStack.length - 1] = {
        nodes: this.deepClone(nodes),
        selectedNodeIds: [...selectedNodeIds],
        action,
        timestamp: now,
      };
      return;
    }

    this.undoStack.push({
      nodes: this.deepClone(nodes),
      selectedNodeIds: [...selectedNodeIds],
      action,
      timestamp: now,
    });

    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }

    // Clear redo stack on any new user action
    this.redoStack = [];
    this.lastSnapshotTime = now;
  }

  // Undo step
  public undo(): HistorySnapshot | null {
    if (this.undoStack.length <= 1) {
      return null;
    }

    const current = this.undoStack.pop()!;
    this.redoStack.push(current);

    const previous = this.undoStack[this.undoStack.length - 1];
    return {
      nodes: this.deepClone(previous.nodes),
      selectedNodeIds: [...previous.selectedNodeIds],
      action: previous.action,
      timestamp: previous.timestamp,
    };
  }

  // Redo step
  public redo(): HistorySnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const next = this.redoStack.pop()!;
    this.undoStack.push(next);

    return {
      nodes: this.deepClone(next.nodes),
      selectedNodeIds: [...next.selectedNodeIds],
      action: next.action,
      timestamp: next.timestamp,
    };
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoAction(): string | null {
    if (this.undoStack.length <= 1) return null;
    return this.undoStack[this.undoStack.length - 1].action;
  }

  public getRedoAction(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].action;
  }

  public getStackSize(): { undo: number; redo: number } {
    return {
      undo: Math.max(0, this.undoStack.length - 1),
      redo: this.redoStack.length,
    };
  }

  public clear(initialNodes: SvgNode[] = [], initialSelectedIds: string[] = []): void {
    this.undoStack = [{
      nodes: this.deepClone(initialNodes),
      selectedNodeIds: [...initialSelectedIds],
      action: 'Reset Document',
      timestamp: Date.now(),
    }];
    this.redoStack = [];
  }
}
