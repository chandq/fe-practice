// src/components/IframeToolbar.vue
<template>
  <button
    class="toolbar-button am-button"
    :title="title"
    @click="handleClick"
    :disabled="disabled"
    type="button"
  >
    <span class="toolbar-button-icon">
      <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path
          d="M832 128H192c-35.2 0-64 28.8-64 64v640c0 35.2 28.8 64 64 64h640c35.2 0 64-28.8 64-64V192c0-35.2-28.8-64-64-64z m-32 672H224V224h576v576z m-96-480H320v384h384V320z m-32 352H352V352h320v320z"
        />
      </svg>
    </span>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { EngineInterface } from '@aomao/engine'

// Props 定义保持不变
const props = defineProps<{
  engine: EngineInterface
  disabled: boolean
}>()

// title 和 handleClick 逻辑保持不变
const title = computed(() => {
  return props.engine.language.get('iframe', 'cardLink', 'title')
})

const handleClick = () => {
  if (props.disabled) return
  const url = prompt(props.engine.language.get('iframe', 'cardLink', 'placeholder'))
  if (url) {
    if (/^https?:\/\//.test(url)) {
      props.engine.command.execute('iframe', url)
    } else {
      alert('请输入有效的 URL')
    }
  }
}
</script>

<style scoped>
/* 为了让我们的自定义按钮样式和官方按钮完全一致，
  最好遵循官方的样式结构。
*/
.am-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background-color: transparent;
  color: #595959;
  height: 24px;
  min-width: 24px;
  padding: 0 4px;
  margin: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s;
}

.am-button:hover {
  background-color: #f5f5f5;
}

.am-button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
  background-color: transparent;
}

.toolbar-button-icon {
  display: inline-block;
  font-size: 16px; /* 控制SVG图标的大小 */
  line-height: 1;
}
</style>
