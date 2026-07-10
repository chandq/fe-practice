<script setup lang="ts">
import { ref, computed } from 'vue'
import HtmlDiff from 'htmldiff-js'

const oldHtml = ref(`<h1>项目概述</h1>
<p>这是一个<strong>结构化文档</strong>管理系统。</p>
<h2>功能模块</h2>
<p>支持文档的创建、编辑和导出功能。</p>
<h2>技术栈</h2>
<p>前端使用 Vue 3 + am-editor 实现。</p>
<h2>部署说明</h2>
<p>使用 Docker 容器化部署，支持多环境配置。</p>`)

const newHtml = ref(`<h1>项目概述</h1>
<p>这是一个<strong>智能文档</strong>管理系统，支持 AI 辅助。</p>
<h2>功能模块</h2>
<p>支持文档的创建、编辑、<em>对比</em>和导出功能。</p>
<h2>技术栈</h2>
<p>前端使用 Vue 3 + TipTap 实现。</p>
<h3>新增：权限管理</h3>
<p>支持基于角色的访问控制（RBAC）。</p>`)

const diffResult = computed(() => {
  return HtmlDiff.execute(oldHtml.value, newHtml.value)
})
</script>

<template>
  <div class="html-diff-demo">
    <h1>HTML Diff 对比 Demo</h1>
    <p class="desc">基于 <code>htmldiff-js</code>，编辑左右两侧 HTML，下方实时展示合并对比结果。</p>

    <div class="editor-panels">
      <div class="panel">
        <h3>📄 旧文档 HTML</h3>
        <textarea v-model="oldHtml" class="html-input" spellcheck="false" />
      </div>
      <div class="panel">
        <h3>📄 新文档 HTML</h3>
        <textarea v-model="newHtml" class="html-input" spellcheck="false" />
      </div>
    </div>

    <div class="diff-section">
      <h3>🔀 合并对比结果（实时）</h3>
      <div class="diff-output" v-html="diffResult" />
    </div>

    <div class="preview-panels">
      <div class="diff-section">
        <h3>旧文档渲染预览</h3>
        <div class="preview-output" v-html="oldHtml" />
      </div>
      <div class="diff-section">
        <h3>新文档渲染预览</h3>
        <div class="preview-output" v-html="newHtml" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.html-diff-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.html-diff-demo > h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.desc {
  color: #666;
  margin-bottom: 24px;
}

.desc code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.editor-panels {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.panel {
  flex: 1;
}

.panel h3 {
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}

.html-input {
  width: 100%;
  height: 260px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  resize: vertical;
  box-sizing: border-box;
  background: #fafafa;
}

.html-input:focus {
  outline: none;
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1);
}

.diff-section {
  margin-bottom: 24px;
}

.diff-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.diff-output,
.preview-output {
  padding: 16px 20px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  line-height: 1.8;
  font-size: 15px;
  background: #fff;
}

.diff-output :deep(ins) {
  background-color: #e6ffed;
  color: #1a7f37;
  text-decoration: none;
  padding: 1px 4px;
  border-radius: 3px;
}

.diff-output :deep(del) {
  background-color: #ffeef0;
  color: #cf222e;
  text-decoration: line-through;
  padding: 1px 4px;
  border-radius: 3px;
}

.preview-panels {
  display: flex;
  gap: 16px;
}

.preview-panels .diff-section {
  flex: 1;
}

.preview-output :deep(h1) {
  font-size: 22px;
  margin-bottom: 8px;
}

.preview-output :deep(h2) {
  font-size: 18px;
  margin: 12px 0 8px;
}

.preview-output :deep(h3) {
  font-size: 16px;
  margin: 10px 0 6px;
}

.preview-output :deep(p) {
  margin: 6px 0;
}
</style>
