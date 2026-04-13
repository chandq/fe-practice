// src/App.vue
<template>
  <div class="editor-wrapper">
    <button @click="getContent">文本内容</button>
    <Toolbar v-if="engine" :engine="engine" :items="toolbarItems" />
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, onUnmounted, h } from 'vue'
// 从 @aomao/engine 导入引擎核心和语言包
import Engine, { EngineInterface, ToolbarOptions } from '@aomao/engine'
// ✅ 关键修正：从 @aomao/toolbar-vue 导入 Toolbar 类
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar-vue'
import AmImage, { ImageComponent, ImageUploader } from '@aomao/plugin-image'

// 引入基础插件
import Redo from '@aomao/plugin-redo'
import Undo from '@aomao/plugin-undo'
import Bold from '@aomao/plugin-bold'
import CodeBlock, { CodeBlockComponent } from '@aomao/plugin-codeblock'

// 引入我们自己的插件和卡片
import IframePlugin from './plugins/iframe'
import IframeCard from './plugins/iframe/card'
import iframeZhCn from './plugins/iframe/locale/zh-cn'

import localforage from 'localforage'

// DOM 引用
const editorRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)

// Engine 实例，使用 shallowRef 避免 Vue 深度代理
const engine = shallowRef<EngineInterface | null>(null)

// ✅ 关键：重新定义 toolbarItems
const toolbarItems = ref<ToolbarOptions>([])

function init() {
  // 1. 创建引擎实例
  // ✅ 关键修正：构造函数中不再有 render 参数
  const engineInstance = new Engine(editorRef.value, {
    // 注册插件
    plugins: [Redo, Undo, ToolbarPlugin, Bold, CodeBlock, IframePlugin, AmImage, ImageUploader],
    // 注册卡片
    cards: [ToolbarComponent, CodeBlockComponent, IframeCard, ImageComponent],
    // 字体
    iconFonts: [
      {
        url: '/font_editor.woff2',
        format: 'woff2'
      }
    ],
    config: {
      [AmImage.pluginName]: {
        onBeforeRender: (_status: any, src: string | any) => {
          if (typeof src === 'string') return src
          else return src.url
        }
      },
      [ImageUploader.pluginName]: {
        file: {
          // action: 'http://example.com/upload'
        },
        isRemote: (src: string) => {
          try {
            const url = new URL(src)
            // if (hosts?.includes(url.host)) {
            //   return false
            // }
            if (src.includes('/doc/cc/oss/preview')) {
              return false
            }
            if (url.pathname.startsWith('/spi')) {
              return false
            }
            return true
          } catch (error) {
            return false
          }
        },
        remote: {
          action: ''
        },
        // parse,
        limitSize: 1024 * 1024 * 50
      }
    }
    // 配置语言
    // lang: 'zh-cn'
  })
  console.log('engineInstance', engineInstance)
  // 工具栏配置保持不变
  toolbarItems.value = [
    [
      {
        type: 'collapse',
        groups: [
          {
            items: [
              // { name: 'drawio', icon: flowchartIcon, title: '流程图' },
              { name: 'image-uploader' },
              { name: 'codeblock' },
              { name: 'table' },
              { name: 'file-uploader' },
              { name: 'video-uploader' },
              { name: 'math' },
              { name: 'status' }
            ]
          }
        ]
      }
    ],
    ['undo', 'redo', 'bold'],
    [
      {
        // 告诉工具栏，这是一个标准的按钮
        type: 'button',
        // 按钮的名称，保持唯一
        name: 'iframe',
        // 从语言包获取标题
        title: engineInstance.language.get('iframe', 'cardLink', 'title'),
        // ✅✅✅ 最核心的部分：使用 h 函数创建图标的虚拟DOM
        icon: 'undo',
        // ✅ 定义点击事件的执行逻辑
        // aomao/toolbar-vue 会在调用时自动传入 engine 实例
        onExecute: (engine: EngineInterface) => {
          const url = prompt(engine.language.get('iframe', 'cardLink', 'placeholder'))
          debugger
          if (url) {
            if (/^https?:\/\//.test(url)) {
              engine.command.execute('iframe', url)
            } else {
              alert('请输入有效的 URL')
            }
          }
        }
      }
    ]
  ]

  // 添加我们的中文语言包
  // Language.add('zh-cn', iframeZhCn)

  // 2. 创建工具栏
  // ✅ 关键修正：这里的 Toolbar 来自 @aomao/toolbar-vue，它知道如何处理Vue组件
  // new Toolbar({
  //   engine: engineInstance,
  //   container: toolbarRef.value,
  //   items: toolbarItems
  // })

  const tempContent = localStorage.getItem('editorContent')
  console.log('tempContent', tempContent)
  // 设置初始内容
  engineInstance.setHtml(
    tempContent ??
      '<h2>欢迎使用 Aomao Iframe 插件</h2><p>点击下方工具栏的图标来插入一个内嵌页面吧！</p>'
  )
  engineInstance.on('blur', () => {
    console.log('engineInstance-blur', engineInstance.getHtml())
    localStorage.setItem('editorContent', engineInstance.getHtml())
  })
  // 保存引擎实例
  engine.value = engineInstance
}

function testIndexedDB() {
  localforage.config({
    driver: localforage.INDEXEDDB
  })
  const myDatabase = localforage.createInstance({
    name: 'myDatabase',
    storeName: 'customers'
  })

  myDatabase.setItem('1', { id: 1, name: 'John Doe', email: 'john@example.com' })
  myDatabase.setItem('2', { id: 2, name: 'Jane Doe', email: 'jane@example.com' })
}

onMounted(() => {
  if (!editorRef.value) return

  init()
  testIndexedDB()
})

function getContent() {
  console.log('getContent:', engine.value.getHtml())
}

onUnmounted(() => {
  // 销毁引擎实例
  engine.value?.destroy()
})
</script>

<style>
/* 引入卡片样式 */
@import './plugins/iframe/card.css';
.editor-wrapper {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  max-width: 800px;
}
.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid #d9d9d9;
  /* 让工具栏内容换行 */
  flex-wrap: wrap;
}
.editor-container {
  height: 400px;
  padding: 16px;
  outline: none;
}
.editor-container .am-engine {
  height: 100%;
}
</style>
