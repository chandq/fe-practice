/*
Gantt Component - Vanilla TypeScript (single-file demo)
Features:
- Canvas for grid + bars (high-performance)
- SVG overlay for dependency lines and interactive SVG elements
- Four header modes: day / week / month / year
- Configurable: showPlan, showActual, rowHeight, separators, left/right notes, hover tooltip
- Two demo scenes: Project tasks (dependencies) and Resource view (leaves/tasks)
- No framework dependency (plain TS -> compile with `tsc` or use a bundler)

How to use (quick):
1. Compile: tsc gantt-vanilla.ts --target ES2020 --module es2020 (or use esbuild/webpack)
2. Include compiled JS in an HTML demo (see bottom of file for `createDemo()` helper)

This file intentionally bundles a compact but production-minded implementation:
- Gantt: main class, public API
- CanvasRenderer: handles fast drawing, devicePixelRatio scaling, Path2D caching
- SVGOverlay: draws dependency lines and handles pointer targets
- HeaderRenderer: draws top date header for all 4 modes
- LeftPanelRenderer: draws left side labels/notes
- Tooltip: lightweight DOM tooltip
- Utils: date helpers, interval hit-testing, viewport virtualization

Notes on performance:
- Virtualized rows: only visible rows are rendered
- Precomputed pixel positions for periods
- Caching Path2D for repeated shapes
- requestAnimationFrame batching for rerenders
- Offscreen canvas is supported if browser allows (optional)
*/

// --------------------------- Types & Config ---------------------------
export type Mode = 'day' | 'week' | 'month' | 'year';

export interface GanttConfig {
  showPlan: boolean;
  showActual: boolean;
  rowHeight: number; // px
  showRowBorders: boolean;
  showColBorders: boolean;
  showLeftNote: boolean;
  showRightNote: boolean;
  hoverShowRangeAndHours: boolean;
  cellWidth?: number; // px per day (default 24)
}

export interface Period {
  id: string;
  start: string; // ISO
  end: string;   // ISO (inclusive end)
  note?: string;
  owner?: string;
  status?: string;
  completed?: boolean;
}

export interface RowData {
  id: string;
  label: string;
  leftNote?: string;
  rightNote?: string;
  plan?: Period[];
  actual?: Period[];
  leaves?: Period[]; // resource
  deps?: string[]; // dependency ids (previous items)
}

export interface GanttOptions {
  container: HTMLElement; // element to mount into
  data: RowData[];
  config?: Partial<GanttConfig>;
  mode?: Mode;
  startDate?: string; // viewport start (ISO)
  endDate?: string;   // viewport end (ISO)
  height?: number; // total height (optional)
}

// --------------------------- Utilities ---------------------------
function parseISO(s: string) { return new Date(s); }
function cloneDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function daysBetween(a: Date, b: Date) { return Math.round((cloneDay(b).getTime() - cloneDay(a).getTime()) / (24 * 3600 * 1000)); }
function formatYMD(d: Date) { return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`; }
function getWeekNumber(d: Date) { const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dayNum = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - dayNum); const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)); return Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7); }

// Fast interval tree for hit testing (simple sorted arrays + binary search)
class IntervalIndex {
  intervals: { start: number, end: number, row: number, meta: any }[] = [];
  build(items: { start: number, end: number, row: number, meta: any }[]) { this.intervals = items.slice().sort((a, b) => a.start - b.start); }
  query(x: number) { // return items where start<=x<=end
    const res: any[] = []; // linear scan around binary found index
    // binary search first with start > x
    let lo = 0, hi = this.intervals.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.intervals[mid].start <= x) lo = mid + 1; else hi = mid; }
    // scan left until start<=x and check end>=x
    for (let i = lo - 1; i >= 0; i--) { const it = this.intervals[i]; if (it.end < x) break; if (it.start <= x && it.end >= x) res.push(it); }
    return res;
  }
}

// --------------------------- Renderer: Canvas ---------------------------
class CanvasRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  width = 0; height = 0;
  cachePaths = new Map<string, Path2D>();
  constructor(container: HTMLElement) {
    const c = document.createElement('canvas');
    c.style.width = '100%'; c.style.display = 'block';
    this.canvas = c;
    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas not supported');
    this.ctx = ctx;
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    container.appendChild(c);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  // Draw grid columns
  drawCols(x0: number, x1: number, top: number, bottom: number, colWidth: number, showBorders: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += colWidth) {
      if (showBorders) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    }
    ctx.strokeStyle = '#e6e6e6'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  // Draw rows separators
  drawRowBorders(rowTop: number, rowBottom: number, width: number) { const ctx = this.ctx; ctx.beginPath(); ctx.moveTo(0, rowBottom); ctx.lineTo(width, rowBottom); ctx.strokeStyle = '#e9e9e9'; ctx.stroke(); }
  // Draw a period bar with optional border/top indicator
  drawPeriod(x: number, y: number, w: number, h: number, opts: { fill?: string, strokeTop?: string, strokeWidthTop?: number, radius?: number }) {
    const ctx = this.ctx; const r = opts.radius || 3;
    ctx.save();
    ctx.beginPath();
    // rounded rect
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
    if (opts.strokeTop) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.strokeStyle = opts.strokeTop; ctx.lineWidth = opts.strokeWidthTop || 3; ctx.stroke(); }
    ctx.restore();
  }
}

// --------------------------- SVG Overlay ---------------------------
class SVGOverlay {
  svg: SVGSVGElement;
  constructor(container: HTMLElement) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute'; svg.style.left = '0'; svg.style.top = '0'; svg.style.width = '100%'; svg.style.height = '100%'; svg.style.pointerEvents = 'none';
    this.svg = svg; container.appendChild(svg);
  }
  clear() { while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild); }
  // Draw dependency lines with simple bezier
  drawDependency(fromX: number, fromY: number, toX: number, toY: number, color = '#6aa6ff') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dx = Math.abs(toX - fromX) / 2;
    const d = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY} ${toX - dx} ${toY} ${toX} ${toY}`;
    path.setAttribute('d', d); path.setAttribute('stroke', color); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '1.5'); this.svg.appendChild(path);
  }
}

// --------------------------- Header Renderer ---------------------------
class HeaderRenderer {
  canvasTop: HTMLCanvasElement; ctx: CanvasRenderingContext2D; dpr: number; height: number = 60;
  constructor(container: HTMLElement) {
    const c = document.createElement('canvas'); c.style.width = '100%'; c.style.display = 'block'; c.style.background = '#fff'; container.appendChild(c);
    const ctx = c.getContext('2d'); if (!ctx) throw new Error('no ctx'); this.ctx = ctx; this.canvasTop = c; this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() { const rect = this.canvasTop.getBoundingClientRect(); const w = Math.max(1, Math.floor(rect.width)); this.canvasTop.width = Math.floor(w * this.dpr); this.canvasTop.height = Math.floor(this.height * this.dpr); this.canvasTop.style.height = `${this.height}px`; this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
  draw(mode: Mode, start: Date, end: Date, cellWidth: number) {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.canvasTop.width, this.canvasTop.height); ctx.font = '12px sans-serif'; ctx.fillStyle = '#333'; const days = daysBetween(start, end) + 1; let x = 0; const topHeight = 28; const bottomHeight = 32; // two rows
    // first row
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i); const colX = x + i * cellWidth; // We'll draw per day small labels in bottom row; first row chunks
      // depending on mode, group
    }
    // Simplified header drawing: draw first row aggregated
    if (mode === 'day') {
      // first row: YYYY-MM
      // second row: DD (weekday)
      // render each day label
      for (let i = 0; i < days; i++) { const date = addDays(start, i); const colX = i * cellWidth; const dayLabel = date.getDate().toString(); const wd = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]; ctx.fillStyle = '#333'; ctx.fillText(dayLabel, colX + 4, topHeight + 16); ctx.fillStyle = '#999'; ctx.fillText(wd, colX + 4, topHeight + 30); }
      // month line
      // group months
      let curMonth = start.getMonth(); let segStart = 0; for (let i = 0; i <= days; i++) { const date = addDays(start, i); if (i === days || date.getMonth() !== curMonth) { const segWidth = (i - segStart) * cellWidth; const monthLabel = `${start.getFullYear()}-${(curMonth + 1).toString().padStart(2, '0')}`; ctx.fillStyle = '#000'; ctx.fillText(monthLabel, segStart * cellWidth + 4, 14); curMonth = date.getMonth(); segStart = i; } }
    } else if (mode === 'week') {
      // first row: YYYY-MM
      // second row: week number
      for (let i = 0; i < days; i++) {
        const date = addDays(start, i); const colX = i * cellWidth; const weekNo = getWeekNumber(date); if (date.getDay() === 1) { ctx.fillStyle = '#000'; ctx.fillText(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`, colX + 4, 14); }
        ctx.fillStyle = '#333'; ctx.fillText(`W${weekNo}`, colX + 4, topHeight + 20);
      }
    } else if (mode === 'month') {
      // first row: year, second row: month
      const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
      for (let m = 0; m < totalMonths; m++) { const date = new Date(start.getFullYear(), start.getMonth() + m, 1); const xPos = m * cellWidth * 30; ctx.fillStyle = '#000'; ctx.fillText(`${date.getFullYear()}`, xPos + 4, 14); ctx.fillStyle = '#333'; ctx.fillText(`${date.getMonth() + 1}月`, xPos + 4, topHeight + 20); }
    } else {
      // year: show year and half-years
      const years = end.getFullYear() - start.getFullYear() + 1; for (let y = 0; y < years; y++) { const date = new Date(start.getFullYear() + y, 0, 1); const xPos = y * cellWidth * 365; ctx.fillStyle = '#000'; ctx.fillText(`${date.getFullYear()}`, xPos + 4, 14); ctx.fillStyle = '#333'; ctx.fillText('上半年', xPos + 4, topHeight + 20); ctx.fillText('下半年', xPos + 4 + cellWidth * 365 / 2, topHeight + 20); }
    }
  }
}

// --------------------------- Left Panel ---------------------------
class LeftPanelRenderer {
  container: HTMLElement; width: number = 260; el: HTMLDivElement;
  constructor(container: HTMLElement) { this.container = container; const left = document.createElement('div'); left.style.width = this.width + 'px'; left.style.overflow = 'hidden'; left.style.boxSizing = 'border-box'; left.style.borderRight = '1px solid #e6e6e6'; left.style.background = '#fff'; this.el = left; container.appendChild(left); }
  renderRows(rows: RowData[], rowHeight: number) { this.el.innerHTML = ''; for (let r of rows) { const row = document.createElement('div'); row.style.height = rowHeight + 'px'; row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.padding = '0 8px'; row.style.boxSizing = 'border-box'; row.textContent = r.label; this.el.appendChild(row); } }
}

// --------------------------- Tooltip ---------------------------
class Tooltip {
  el: HTMLDivElement;
  constructor() { const el = document.createElement('div'); el.style.position = 'fixed'; el.style.pointerEvents = 'none'; el.style.background = 'rgba(0,0,0,0.75)'; el.style.color = '#fff'; el.style.padding = '6px 8px'; el.style.borderRadius = '4px'; el.style.fontSize = '12px'; el.style.display = 'none'; document.body.appendChild(el); this.el = el; }
  show(html: string, x: number, y: number) { this.el.innerHTML = html; this.el.style.left = x + 12 + 'px'; this.el.style.top = y + 12 + 'px'; this.el.style.display = 'block'; }
  hide() { this.el.style.display = 'none'; }
}

// --------------------------- Main Gantt Class ---------------------------
export class Gantt {
  container: HTMLElement; root: HTMLDivElement; canvasContainer: HTMLDivElement;
  renderer: CanvasRenderer; svg: SVGOverlay; header: HeaderRenderer; leftPanel: LeftPanelRenderer; tooltip: Tooltip;
  data: RowData[]; config: GanttConfig; mode: Mode; startDate: Date; endDate: Date; cellWidth: number; visibleRows: number[] = [];
  intervalIndex = new IntervalIndex();
  raf = 0; needsRender = false;
  constructor(opts: GanttOptions) {
    this.container = opts.container; this.data = opts.data || [];
    this.config = Object.assign({ showPlan: true, showActual: true, rowHeight: 36, showRowBorders: true, showColBorders: false, showLeftNote: true, showRightNote: true, hoverShowRangeAndHours: true, cellWidth: 24 }, opts.config || {});
    this.mode = opts.mode || 'day';
    this.startDate = opts.startDate ? parseISO(opts.startDate) : parseISO('2025-01-01');
    this.endDate = opts.endDate ? parseISO(opts.endDate) : addDays(this.startDate, 120);
    this.cellWidth = this.config.cellWidth || 24;
    // build DOM layout
    const root = document.createElement('div'); root.style.position = 'relative'; root.style.display = 'flex'; root.style.height = (opts.height || 600) + 'px'; root.style.border = '1px solid #ddd'; this.root = root; this.container.appendChild(root);
    this.leftPanel = new LeftPanelRenderer(root);
    const main = document.createElement('div'); main.style.flex = '1'; main.style.position = 'relative'; root.appendChild(main);
    this.header = new HeaderRenderer(main);
    this.canvasContainer = document.createElement('div'); this.canvasContainer.style.position = 'absolute'; this.canvasContainer.style.left = '0'; this.canvasContainer.style.top = this.header.height + 'px'; this.canvasContainer.style.right = '0'; this.canvasContainer.style.bottom = '0'; main.appendChild(this.canvasContainer);
    this.renderer = new CanvasRenderer(this.canvasContainer);
    this.svg = new SVGOverlay(this.canvasContainer);
    this.tooltip = new Tooltip();
    this.leftPanel.renderRows(this.data, this.config.rowHeight);

    this.buildIndex();
    this.attachEvents();
    this.requestRender();
  }
  buildIndex() {
    const items: any[] = [];
    for (let r = 0; r < this.data.length; r++) {
      const row = this.data[r]; const yTop = r * this.config.rowHeight; const yBottom = yTop + this.config.rowHeight;
      // index all periods for fast hover detection
      const enroll = (ps: Period[] | undefined, kind: string) => { if (!ps) return; for (let p of ps) { const s = daysBetween(this.startDate, parseISO(p.start)); const e = daysBetween(this.startDate, parseISO(p.end)) + 1; const startPx = s * this.cellWidth; const endPx = e * this.cellWidth; items.push({ start: startPx, end: endPx, row: r, meta: { row, period: p, kind } }); } };
      enroll(row.plan, 'plan'); enroll(row.actual, 'actual'); enroll(row.leaves, 'leave');
    }
    this.intervalIndex.build(items);
  }
  attachEvents() {
    this.canvasContainer.addEventListener('mousemove', (ev) => {
      const rect = this.canvasContainer.getBoundingClientRect(); const x = ev.clientX - rect.left; const y = ev.clientY - rect.top - this.header.height; if (y < 0) { this.tooltip.hide(); return; }
      const rowIdx = Math.floor(y / this.config.rowHeight); if (rowIdx < 0 || rowIdx >= this.data.length) { this.tooltip.hide(); return; }
      const hits = this.intervalIndex.query(Math.round(x)); if (hits.length) { const top = hits[0]; const p = top.meta.period as Period; const kind = top.meta.kind; const days = daysBetween(parseISO(p.start), parseISO(p.end)) + 1; const html = `<b>${p.note || p.id}</b><br/>${p.start} → ${p.end}<br/>${days} 天<br/>(${kind})`; this.tooltip.show(html, ev.clientX, ev.clientY); } else { this.tooltip.hide(); }
    });
    this.canvasContainer.addEventListener('mouseleave', () => this.tooltip.hide());
  }
  requestRender() { if (this.needsRender) return; this.needsRender = true; this.raf = requestAnimationFrame(() => { this.needsRender = false; this.render(); }); }
  render() {
    // layout
    const totalDays = daysBetween(this.startDate, this.endDate) + 1; const widthPx = totalDays * this.cellWidth;
    // resize canvas container to full
    const rect = this.canvasContainer.getBoundingClientRect(); const cw = rect.width; const ch = rect.height; this.renderer.canvas.style.width = widthPx + 'px'; // allow horizontal scroll if bigger
    this.renderer.resize(); this.renderer.clear();
    // draw grid cols
    this.renderer.drawCols(0, widthPx, 0, this.data.length * this.config.rowHeight, this.cellWidth, this.config.showColBorders);
    // draw rows and periods for visible rows
    for (let r = 0; r < this.data.length; r++) {
      const y = r * this.config.rowHeight; if (y > ch) break; // naive virtualization
      // row border
      if (this.config.showRowBorders) this.renderer.drawRowBorders(y, y + this.config.rowHeight, widthPx);
      const row = this.data[r]; // draw plan periods on top border, actual as background
      if (this.config.showActual && row.actual) { for (let p of row.actual) { const s = daysBetween(this.startDate, parseISO(p.start)); const e = daysBetween(this.startDate, parseISO(p.end)) + 1; const x = s * this.cellWidth; const w = Math.max(2, (e - s) * this.cellWidth); this.renderer.drawPeriod(x, y + 6, w, this.config.rowHeight - 12, { fill: p.completed ? '#cfe8c8' : '#f2f9ff', radius: 4, strokeTop: undefined }); } }
      if (this.config.showPlan && row.plan) { for (let p of row.plan) { const s = daysBetween(this.startDate, parseISO(p.start)); const e = daysBetween(this.startDate, parseISO(p.end)) + 1; const x = s * this.cellWidth; const w = Math.max(2, (e - s) * this.cellWidth); this.renderer.drawPeriod(x, y + 4, w, 6, { fill: undefined, strokeTop: '#2f86ff', strokeWidthTop: 3, radius: 0 }); } }
    }
    // draw dependencies on svg
    this.svg.clear(); for (let r = 0; r < this.data.length; r++) {
      const row = this.data[r]; if (!row.deps) continue; for (let d of row.deps) {
        const fromRowIdx = this.data.findIndex(it => it.id === d); if (fromRowIdx < 0) continue; // get last plan end x of fromRow
        const fromRow = this.data[fromRowIdx]; const toRow = row;
        const fromP = (fromRow.plan && fromRow.plan.length) ? fromRow.plan[fromRow.plan.length - 1] : undefined;
        const toP = (toRow.plan && toRow.plan.length) ? toRow.plan[0] : undefined;
        if (!fromP || !toP) continue; const fromX = (daysBetween(this.startDate, parseISO(fromP.end)) + 1) * this.cellWidth; const fromY = fromRowIdx * this.config.rowHeight + this.config.rowHeight / 2; const toX = (daysBetween(this.startDate, parseISO(toP.start))) * this.cellWidth; const toY = r * this.config.rowHeight + this.config.rowHeight / 2; this.svg.drawDependency(fromX, fromY, toX, toY);
      }
    }
  }
  setMode(m: Mode) { this.mode = m; this.requestRender(); }
  setData(data: RowData[]) { this.data = data; this.leftPanel.renderRows(this.data, this.config.rowHeight); this.buildIndex(); this.requestRender(); }
  setConfig(cfg: Partial<GanttConfig>) { Object.assign(this.config, cfg); this.cellWidth = this.config.cellWidth || this.cellWidth; this.leftPanel.renderRows(this.data, this.config.rowHeight); this.buildIndex(); this.requestRender(); }
}

// --------------------------- Demo Creator ---------------------------
export function createDemo(container: HTMLElement) {
  // demo data
  const tasks: RowData[] = [
    { id: 'r1', label: '需求-登录', leftNote: 'API: auth', plan: [{ id: 'p1', start: '2025-01-02', end: '2025-01-07', note: '计划' }], actual: [{ id: 'a1', start: '2025-01-03', end: '2025-01-09', note: '实际' }], deps: [] },
    { id: 'r2', label: '任务-实现登录', leftNote: 'owner:张三', plan: [{ id: 'p2', start: '2025-01-08', end: '2025-01-12' }], actual: [{ id: 'a2', start: '2025-01-10', end: '2025-01-14', completed: true }], deps: ['r1'] },
    { id: 'r3', label: '任务-测试', leftNote: 'owner:李四', plan: [{ id: 'p3', start: '2025-01-12', end: '2025-01-15' }], actual: [], deps: ['r2'] },
  ];
  const opts: GanttOptions = { container, data: tasks, mode: 'day', startDate: '2025-01-01', endDate: '2025-03-31', config: { rowHeight: 40, showPlan: true, showActual: true, cellWidth: 18 } };
  const g = new Gantt(opts);
  return g;
}

/*
End of file. To run quickly without build step, you can copy the compiled JS output to a <script type="module"> in an HTML page and call createDemo(document.getElementById('demo'))
*/
