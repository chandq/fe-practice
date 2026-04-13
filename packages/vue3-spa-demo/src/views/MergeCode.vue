<!--
  MergeCode.vue

  A Vue 3 component for three-way merge conflict resolution with Monaco Editor integration.

  Features:
  - Three-panel layout (Incoming, Merge Result, Current)
  - Visual conflict highlighting and navigation
  - Interactive conflict resolution actions
  - Bulk accept operations
  - Language detection and syntax highlighting
  - Real-time synchronization between panels

  Props: None
  Emits: None

  Dependencies:
  - vue 3 (Composition API)
  - monaco-editor
  - monaco-editor worker

  Usage:
  Import and use as a standalone component. The component handles its own state
  and provides a complete merge conflict resolution interface.

  Author: chendq
  Created: 2026-02-28 14:39:25
  Version: 1.0.0
-->
<template>
  <div class="merge-wrapper">
    <nav class="merge-navbar">
      <div class="brand">PRO MERGE <span class="v-tag">STABLE 2025</span></div>
      <div class="ctrl-group">
        <div class="conflict-counter" v-if="conflicts.length">
          {{ conflictIndex + 1 }} / {{ conflicts.length }} 冲突
        </div>
        <button class="nav-btn" @click="navigate(-1)">▲ 上一个</button>
        <button class="nav-btn" @click="navigate(1)">▼ 下一个</button>
        <div class="v-sep"></div>
        <button class="bulk-btn cur" @click="bulkAccept('current')">接受所有 Current</button>
        <button class="bulk-btn inc" @click="bulkAccept('incoming')">接受所有 Incoming</button>
        <button class="reset-link" @click="resetCode">重置</button>
      </div>
    </nav>

    <div class="editor-main-layout">
      <div class="pane side-pane">
        <div class="pane-head inc-head">Incoming (Remote)</div>
        <div ref="leftRef" class="editor-instance"></div>
      </div>
      <div class="pane center-pane">
        <div class="pane-head res-head">Merge Result</div>
        <div ref="midRef" class="editor-instance"></div>
      </div>
      <div class="pane side-pane">
        <div class="pane-head cur-head">Current (Local)</div>
        <div ref="rightRef" class="editor-instance"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = { getWorker: () => new EditorWorker() }

const leftRef = ref(null)
const midRef = ref(null)
const rightRef = ref(null)
const editors = shallowRef({ left: null, mid: null, right: null })

const conflicts = ref([])
const conflictIndex = ref(0)

let decorationIds = []
let viewZoneIds = []
let internalChange = false

// 语言映射表：涵盖绝大多数开发场景
const EXT_MAP = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  c: 'c',
  go: 'go',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'shell',
  php: 'php',
  cs: 'csharp',
  rs: 'rust'
}
const fileName = ref('merge.html')
const currentLangId = ref('javascript')

const INITIAL_CODE = `<<<<<<< HEAD
function connect() {
  return "https://localhost:8080";
}
=======
function connect() {
  return "https://api.production.io";
}
>>>>>>> main

<<<<<<< HEAD
const VERSION = "2.1.0-dev";
=======
const VERSION = "2.0.5-stable";
>>>>>>> main`

onMounted(() => {
  // 屏蔽所有语言服务
  const allLangs = Object.values(EXT_MAP)
  const cfg = {
    diagnostics: false,
    documentHighlights: false,
    documentSymbols: false,
    definition: false,
    references: false,
    codeActions: false,
    completionItems: false,
    hovers: false,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    snippetSuggestions: 'none',
    occurrencesHighlight: false,
    renderLineHighlight: 'all',

    folding: false, // 彻底禁用折叠 (修复 getFoldingRanges)
    showFoldingControls: 'never', // 隐藏折叠控件
    breadcrumbs: { enabled: false }, // 禁用面包屑 (修复 findDocumentSymbols)
    links: false, // 禁用链接检测
    contextmenu: false, // 禁用右键菜单
    quickSuggestions: false, // 禁用自动补全建议
    suggest: { enabled: false }, // 禁用建议组件
    parameterHints: { enabled: false }, // 禁用参数提示
    hover: { enabled: false }, // 禁用悬浮提示
    lightbulb: { enabled: false }, // 禁用灯泡提示
    codeLens: false, // 禁用 CodeLens
    wordBasedSuggestions: false, // 禁用基于单词的建议

    // 添加这些配置来解决错误
    documentFormatting: false,
    documentRangeFormatting: false,
    foldingStrategy: 'indentation', // 使用简单折叠策略
    wordWrap: 'off',
    lineNumbers: 'on',
    glyphMargin: true,
    selectOnLineNumbers: true,

    // 重要：禁用符号和折叠相关的功能
    outline: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'off',
    accessibilitySupport: 'off'
  }
  allLangs.forEach((lang) => {
    if (lang === 'javascript' || lang === 'typescript') {
      // TypeScript 特定配置
      monaco.languages.typescript.javascriptDefaults.setModeConfiguration(cfg)
      monaco.languages.typescript.typescriptDefaults.setModeConfiguration(cfg)
    } else {
      // 对其他语言也进行配置
      if (monaco.languages[lang]) {
        if (typeof monaco.languages[lang].defaults !== 'undefined') {
          monaco.languages[lang].defaults.setModeConfiguration &&
            monaco.languages[lang].defaults.setModeConfiguration(cfg)
        }
      }
    }
  })

  monaco.languages.html.htmlDefaults.setModeConfiguration(cfg)
  monaco.languages.css.cssDefaults.setModeConfiguration(cfg)
  monaco.languages.json.jsonDefaults.setModeConfiguration(cfg)
  console.log('monaco.languages', monaco.languages)

  // const cfg = {
  //   // theme: 'vs-dark',
  //   // language: 'javascript',
  //   automaticLayout: true,
  //   minimap: { enabled: false },
  //   scrollBeyondLastLine: false,
  //   fontSize: 13,
  //   contextmenu: false,
  //   lightbulb: { enabled: false },
  //   quickSuggestions: false,
  //   snippetSuggestions: 'none',
  //   wordBasedSuggestions: false,
  //   links: false,
  //   hover: { enabled: false },
  //   occurrencesHighlight: false,
  //   renderLineHighlight: 'all'
  // }

  // // 1. 强制屏蔽所有 JS 服务，消除所有 Missing Handler 报错
  // monaco.languages.typescript.javascriptDefaults.setModeConfiguration({
  //   diagnostics: false,
  //   documentHighlights: false,
  //   documentSymbols: false,
  //   definition: false,
  //   references: false,
  //   codeActions: false,
  //   inlayHints: false
  // })

  editors.value.left = monaco.editor.create(leftRef.value, { ...cfg, readOnly: true })
  editors.value.mid = monaco.editor.create(midRef.value, cfg)
  editors.value.right = monaco.editor.create(rightRef.value, { ...cfg, readOnly: true })

  // 2. 监听同步逻辑
  editors.value.mid.onDidChangeModelContent(() => {
    if (!internalChange) syncData()
  })

  editors.value.mid.onDidScrollChange(() => {
    const top = editors.value.mid.getScrollTop()
    editors.value.left.setScrollTop(top)
    editors.value.right.setScrollTop(top)
  })

  resetCode()

  detectAndSetLanguage()
})

/**
 * 自动识别编程语言并应用
 */
function detectAndSetLanguage() {
  let lang = 'plaintext'

  const parts = fileName.value.split('.')
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : ''
  const langId = EXT_MAP[ext] || 'plaintext'

  if (langId !== currentLangId.value) {
    currentLangId.value = langId
    Object.values(editors.value).forEach((ed) => {
      if (ed) {
        // 确保模型语言设置前应用配置
        const model = ed.getModel()
        if (model) {
          monaco.editor.setModelLanguage(model, langId)
        }
      }
    })
  }
}

function syncData() {
  const code = editors.value.mid.getValue()
  const lines = code.split('\n')
  const leftArr = [],
    rightArr = [],
    parsed = []

  let state = 'NONE',
    start = 0,
    split = 0

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const txt = lines[i]

    if (txt.startsWith('<<<<<<<')) {
      state = 'CUR'
      start = lineNum
      leftArr.push('')
      rightArr.push('')
    } else if (txt.startsWith('=======')) {
      state = 'INC'
      split = lineNum
      leftArr.push('')
      rightArr.push('')
    } else if (txt.startsWith('>>>>>>>')) {
      state = 'NONE'
      parsed.push({
        start,
        split,
        end: lineNum,
        cur: lines.slice(start, split - 1).join('\n'),
        inc: lines.slice(split, lineNum - 1).join('\n')
      })
      leftArr.push('')
      rightArr.push('')
    } else {
      if (state === 'NONE') {
        leftArr.push(txt)
        rightArr.push(txt)
      } else if (state === 'CUR') {
        leftArr.push('')
        rightArr.push(txt)
      } else if (state === 'INC') {
        leftArr.push(txt)
        rightArr.push('')
      }
    }
  }

  internalChange = true
  editors.value.left.setValue(leftArr.join('\n'))
  editors.value.right.setValue(rightArr.join('\n'))
  internalChange = false

  conflicts.value = parsed
  renderUI()
}

function renderUI() {
  const ed = editors.value.mid

  // 3. 彻底重置 ViewZones 和 Decorations
  ed.changeViewZones((accessor) => {
    viewZoneIds.forEach((id) => accessor.removeZone(id))
    viewZoneIds = []

    conflicts.value.forEach((c, idx) => {
      const dom = document.createElement('div')
      dom.className = 'merge-zone-action-bar'

      // 使用原生 DOM 挂载确保事件不被拦截
      const createAction = (label, op, cls) => {
        const btn = document.createElement('span')
        btn.className = `action-link ${cls}`
        btn.innerText = label
        // 核心修复：onmousedown 阻止冒泡并抢夺焦点
        btn.onmousedown = (e) => {
          e.preventDefault()
          e.stopPropagation()
          execResolve(idx, op)
        }
        return btn
      }

      dom.appendChild(createAction('Accept Current', 'cur', 'c-cur'))
      dom.appendChild(document.createTextNode(' | '))
      dom.appendChild(createAction('Accept Incoming', 'inc', 'c-inc'))
      dom.appendChild(document.createTextNode(' | '))
      dom.appendChild(createAction('Accept Both', 'both', 'c-both'))

      viewZoneIds.push(
        accessor.addZone({
          afterLineNumber: c.start - 1,
          heightInLines: 1.5,
          domNode: dom
        })
      )
    })
  })

  const newDecs = []
  conflicts.value.forEach((c) => {
    newDecs.push({
      range: new monaco.Range(c.start, 1, c.split, 1),
      options: { isWholeLine: true, className: 'bg-cur', marginClassName: 'gt-cur' }
    })
    newDecs.push({
      range: new monaco.Range(c.split + 1, 1, c.end, 1),
      options: { isWholeLine: true, className: 'bg-inc', marginClassName: 'gt-inc' }
    })
  })
  decorationIds = ed.deltaDecorations(decorationIds, newDecs)
}

function execResolve(idx, op) {
  const c = conflicts.value[idx]
  if (!c) return

  let result = ''
  if (op === 'cur') result = c.cur
  else if (op === 'inc') result = c.inc
  else result = c.cur + '\n' + c.inc

  const ed = editors.value.mid
  ed.pushUndoStop()
  ed.executeEdits('merge', [
    {
      range: new monaco.Range(c.start, 1, c.end, 9999),
      text: result,
      forceMoveMarkers: true
    }
  ])
  ed.pushUndoStop()
  ed.focus() // 关键：解决 Undo 失效
}

function navigate(dir) {
  if (conflicts.value.length === 0) return

  // 核心修复：索引安全计算
  let next = conflictIndex.value + dir
  if (next >= conflicts.value.length) next = 0
  if (next < 0) next = conflicts.value.length - 1

  conflictIndex.value = next
  const target = conflicts.value[next]

  const ed = editors.value.mid
  ed.revealLineInCenter(target.start)
  ed.setPosition({ lineNumber: target.start, column: 1 })
  ed.focus()
}

function bulkAccept(type) {
  const ed = editors.value.mid
  const edits = [...conflicts.value].reverse().map((c) => ({
    range: new monaco.Range(c.start, 1, c.end, 9999),
    text: type === 'current' ? c.cur : c.inc
  }))
  ed.pushUndoStop()
  ed.executeEdits('bulk', edits)
  ed.pushUndoStop()
  ed.focus()
}

const resetCode = () => {
  editors.value.mid.setValue(window.aStr ?? INITIAL_CODE)
  conflictIndex.value = 0
  syncData()
}

onBeforeUnmount(() => Object.values(editors.value).forEach((e) => e?.dispose()))
</script>

<style>
/* 核心：ViewZone 样式 */
.merge-zone-action-bar {
  background: #252526;
  display: flex;
  align-items: center;
  padding-left: 20px;
  border-top: 1px solid #444;
  z-index: 1000;
  pointer-events: auto !important; /* 强制开启点击 */
}
.action-link {
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  padding: 2px 4px;
}
.action-link:hover {
  text-decoration: underline;
  background: rgba(255, 255, 255, 0.1);
}
.c-cur {
  color: #40c8ae;
}
.c-inc {
  color: #40a6ff;
}
.c-both {
  color: #ccc;
}

/* 区域高亮 */
.bg-cur {
  background: rgba(64, 200, 174, 0.12);
  box-shadow: inset 0 0 0 1px rgba(64, 200, 174, 0.2);
}
.gt-cur {
  background: #40c8ae;
  width: 5px !important;
}
.bg-inc {
  background: rgba(64, 166, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(64, 166, 255, 0.2);
}
.gt-inc {
  background: #40a6ff;
  width: 5px !important;
}
</style>

<style scoped>
.merge-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e1e;
  color: #fff;
  font-family: -apple-system, sans-serif;
}
.merge-navbar {
  height: 44px;
  background: #333;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #000;
  justify-content: space-between;
}
.brand {
  font-weight: bold;
  font-size: 14px;
}
.v-tag {
  font-size: 9px;
  background: #e67e22;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 5px;
}
.ctrl-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conflict-counter {
  font-size: 12px;
  color: #aaa;
  margin-right: 10px;
}

.nav-btn {
  background: #444;
  border: 1px solid #555;
  color: #fff;
  padding: 3px 10px;
  cursor: pointer;
  font-size: 11px;
  border-radius: 2px;
}
.bulk-btn {
  border: none;
  padding: 4px 12px;
  border-radius: 2px;
  font-size: 11px;
  cursor: pointer;
  font-weight: bold;
}
.bulk-btn.cur {
  background: #2b7a6a;
  color: #fff;
}
.bulk-btn.inc {
  background: #2b5a7a;
  color: #fff;
}
.reset-link {
  color: #e67e22;
  background: none;
  border: none;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
  margin-left: 10px;
}
.v-sep {
  width: 1px;
  height: 16px;
  background: #555;
  margin: 0 5px;
}

.editor-main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #2d2d2d;
}
.center-pane {
  flex: 1.5;
  border-left: 2px solid #000;
  border-right: 2px solid #000;
}
.pane-head {
  padding: 5px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  background: #252526;
  text-transform: uppercase;
}
.inc-head {
  color: #40a6ff;
  border-top: 2px solid #40a6ff;
}
.cur-head {
  color: #40c8ae;
  border-top: 2px solid #40c8ae;
}
.res-head {
  color: #fff;
}
.editor-instance {
  flex: 1;
}
</style>
