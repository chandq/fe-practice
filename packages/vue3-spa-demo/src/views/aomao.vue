// src/App.vue9
<template>
  <div class="editor-wrapper">
    <button @click="getContent">文本内容</button>
    <textarea ref="textarea" style="width: 100%; min-height: 320px" v-model="htmlStr" />
    <Toolbar v-if="engine" :engine="engine" :items="toolbarItems" />
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, onUnmounted, h } from 'vue'
// 从 @aomao/engine 导入引擎核心和语言包
import Engine, { EngineInterface, ToolbarOptions } from '@aomao/engine'
// ✅ 关键修正：从 @aomao/toolbar-vue 导入 Toolbar 类
import Toolbar, { ToolbarPlugin, ToolbarComponent, fontFamilyDefaultData } from '@aomao/toolbar-vue'

import Heading from '@aomao/plugin-heading'
import Fontsize from '@aomao/plugin-fontsize'
import Fontfamily from '@aomao/plugin-fontfamily'

// 引入基础插件
import Redo from '@aomao/plugin-redo'
import Undo from '@aomao/plugin-undo'
import Bold from '@aomao/plugin-bold'

import Strikethrough from '@aomao/plugin-strikethrough'
import Sub from '@aomao/plugin-sub'
import Sup from '@aomao/plugin-sup'
import Alignment from '@aomao/plugin-alignment'
import Mark from '@aomao/plugin-mark'
import PaintFormat from '@aomao/plugin-paintformat'
import RemoveFormat from '@aomao/plugin-removeformat'

import Fontcolor from '@aomao/plugin-fontcolor'
import Quote from '@aomao/plugin-quote'

import Link from '@aomao/plugin-link-vue'
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock-vue'
import AmImage, { ImageComponent, ImageUploader } from '@aomao/plugin-image'
import Table, { TableComponent } from '@aomao/plugin-table'

// 引入我们自己的插件和卡片
import IframePlugin from './plugins/iframe'
import IframeCard from './plugins/iframe/card'
import iframeZhCn from './plugins/iframe/locale/zh-cn'

import localforage from 'localforage'

const htmlStr = ref('')
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
    plugins: [
      Redo,
      Undo,
      ToolbarPlugin,
      Bold,
      Strikethrough,
      Sub,
      Sup,
      Alignment,
      Mark,
      Quote,
      PaintFormat,
      RemoveFormat,

      Link,
      Codeblock,
      AmImage,
      ImageUploader,
      Table,
      IframePlugin,
      Heading,
      Fontfamily,
      Fontsize,
      Fontcolor,
      Quote
    ],
    // 注册卡片
    cards: [ToolbarComponent, CodeBlockComponent, IframeCard, ImageComponent, TableComponent],
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
      },
      [Fontsize.pluginName]: {
        //配置粘贴后需要过滤的字体大小
        filter: (fontSize: string) => {
          return (
            [
              '12px',
              '13px',
              '14px',
              '15px',
              '16px',
              '19px',
              '22px',
              '24px',
              '29px',
              '32px',
              '40px',
              '48px'
            ].indexOf(fontSize) > -1
          )
        },
        defaultSize: '16px'
      },
      [Fontfamily.pluginName]: {
        //配置粘贴后需要过滤的字体
        filter: (fontfamily: string) => {
          const item = fontFamilyDefaultData.find((item) =>
            fontfamily
              .split(',')
              .some(
                (name) => item.value.toLowerCase().indexOf(name.replace(/"/, '').toLowerCase()) > -1
              )
          )
          return item ? item.value : false
        }
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
    ['undo', 'redo'],
    ['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
    ['fontcolor', 'backcolor'],
    ['heading', 'fontfamily', 'fontsize'],
    ['link', 'quote', 'hr'],
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
  // engineInstance.setHtml(
  //   `<div class="editor-container am-engine" data-element="root" style="font-size: 16px;"><h2 data-id="h4kgw8yp6-1fyudpvctkw00" id="h4kgw8yp6-1fyudpvctkw00">欢迎使用 Aomao Iframe 插件</h2><p data-id="p1dr9j7ls-ya32ou3w3f40">点击下方工具栏的图标来插入一个内嵌页面吧！ss</p><p data-id="p1dr9j7ls-tjl0x7l2qgg0"><br></p><h2 id="h4kgw8yp6-fo6rb94bo5400" data-id="h4kgw8yp6-fo6rb94bo5400">使用示例</h2><h3 id="h4kgw8yp6-js243krqt8w00" data-id="h4kgw8yp6-js243krqt8w00"><span><del class="diff-removed">使用Roo Code + Tabby 从零</del><ins class="diff-added">使ADD-TEXT用Roo Code + Tabby 从零</ins></span><span style="color: rgb(24, 144, 255);">构建前后端</span>项目示例</h3><blockquote data-id="b1ekkn4bk-hzwar749rhs00" style="margin-top: 5px; margin-bottom: 5px; padding-left: 1em; margin-left: 0px; border-left: 3px solid rgb(238, 238, 238); opacity: 0.6;"><p data-id="p1dr9j7ls-colu6mp50xc00"><span><del class="diff-removed">sdfsdfdfwf</del><ins class="diff-added">sdff</ins></span><span style="color: rgb(245, 34, 45);">ewf</span><span><del class="diff-removed">fsdfsfs</del><ins class="diff-added">ffs</ins></span></p></blockquote><h2 data-id="h4kgw8yp6-1dbtddi712qo" id="h4kgw8yp6-1dbtddi712qo"><span><del class="diff-removed">aaaa</del><ins class="diff-added">aBFCa</ins></span></h2><p data-id="p1dr9j7ls-g95405e9j4o0">bbb</p><div data-id="dh89qey54-ktrsjq4qrww00" data-card-editable="false" data-syntax="plain" auto-wrap="false"><div class="" style="border: 1px solid rgb(232, 232, 232); padding: 8px; background: rgb(249, 249, 249);"><div style="font-family: monospace;font-size: 13px; line-height: 21px; color: #595959; direction: ltr; height: auto; overflow: hidden;background: transparent;"><pre style="color: rgb(89, 89, 89); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"></pre></div></div></div><div class="editor-table-wrapper" style="width:100%;overflow:auto;" data-id="tvrux7s8w-1bm9xj56yxi8-table" data-table-no-border="false"><table data-width="573px" data-id="tvrux7s8w-1bm9xj56yxi8" class="data-table" style="width: 100%; outline: none; border-collapse: collapse;" data-transient-attributes="class"><colgroup data-id="c1e4a4ebk-1ithu0d529og0"><col width="191" data-id="c1uwacwsg-92rpiydbh2w0" span="1"><col width="191" data-id="c1uwacwsg-61l4hc17ucw0" span="1"><col width="191" data-id="c1uwacwsg-5sm9e9zkjz00" span="1"></colgroup><tbody data-id="t1dr9qg4g-23t5v1v7be5c0"><tr data-id="t15ucy39c-1vfmayp73nb40" style="height: 30px;"><td data-id="to1v3dpz4-1uwrzhw3iqkg0" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-19hyyin2c9i80" class="diff-removed"><strong class="diff-removed"><del class="diff-removed">服务地址</del></strong></p></td><td data-id="to1v3dpz4-1s1r1kx044o00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-eytzeuz667400"><a target="_blank" href="http://172.30.85.10:8093" style="font-family: monospace; font-size: inherit; background-color: rgba(0, 0, 0, 0.06); padding: 0px 2px; border: 1px solid rgba(0, 0, 0, 0.08); border-radius: 2px; line-height: inherit; overflow-wrap: break-word; text-indent: 0px;">http://172.30.85.10:8093</a></p></td><td class="table-last-row" data-id="t1fi1b2aw-33d5myviqvq00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-i2ehzzuqppc00">23</p></td></tr><tr data-id="t15ucy39c-g9nn2nv7z3k00" style="height: 30px;"><td data-id="to1v3dpz4-8n2oexngkfs00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-67wylvkugpg00">测试 API key</p></td><td data-id="to1v3dpz4-35poo1tiwce00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-407addd08ly00">sdfdf</p></td><td class="table-last-row" data-id="t1fi1b2aw-4y35eytm2vs00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-7s8id8rbvts00"><br></p></td></tr><tr data-id="t15ucy39c-crkqqxqaygo00" style="height: 30px;"><td class="table-last-column" data-id="t14oj2scg-4tswcacb8ru00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-hfo6jyldmio00">可运送</p></td><td class="table-last-column" data-id="t14oj2scg-e6jqjl3md4g00" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-gsciavj756w00"><br></p></td><td class="table-last-column table-last-row" data-id="tbata35h4-u5kzu2x47j4" style="vertical-align: top; min-width: auto; overflow-wrap: break-word; margin: 4px 8px; border: 1px solid rgb(217, 217, 217); padding: 4px 8px; cursor: default;" data-transient-attributes="table-cell-selection"><p data-id="p1dr9j7ls-awfguocjf4000"><br></p></td></tr><tr style="height:0px"><td width="191px"></td><td width="191px"></td><td width="191px"></td></tr></tbody></table></div><p data-id="p1dr9j7ls-2zw7svsjoku00"><br></p><div data-id="d3dzxvrse-1tctlxtjlt340" data-card-editable="false" data-syntax="typescript" auto-wrap="false"><div class="" style="border: 1px solid rgb(232, 232, 232); padding: 8px; background: rgb(249, 249, 249);"><div style="font-family: monospace;font-size: 13px; line-height: 21px; color: #595959; direction: ltr; height: auto; overflow: hidden;background: transparent;"><pre style="color: rgb(89, 89, 89); margin: 0px; padding: 0px; background: none 0% 0% / auto repeat scroll padding-box border-box rgba(0, 0, 0, 0);"><span style="color: #d73a49;">import</span> { <span style="color: #005cc5;">fileURLToPath</span>, <span style="color: #005cc5;">URL</span> } <span style="color: #d73a49;">from</span><span style="color: #690">'node:url'</span><br><br><span style="color: #d73a49;">import</span> { <span style="color: #005cc5;">defineConfig</span> } <span style="color: #d73a49;">from</span><span style="color: #690">'vite'</span><br><span style="color: #d73a49;">import</span><span style="color: #005cc5;">vue</span><span style="color: #d73a49;">from</span><span style="color: #690">'@vitejs/plugin-vue'</span><br><span style="color: #d73a49;">import</span><span style="color: #005cc5;">vueJsx</span><span style="color: #d73a49;">from</span><span style="color: #690">'@vitejs/plugin-vue-jsx'</span><br><br><span style="color: #6a737d;">// https://vitejs.dev/config/</span><br><span style="color: #d73a49;">export</span><span style="color: #d73a49;">default</span><span>defineConfig</span>({<br><span style="color: #005cc5;">plugins</span>: [<br><span>vue</span>(),<br><span>vueJsx</span>(),<br> ],<br><span style="color: #005cc5;">resolve</span>: {<br><span style="color: #005cc5;">alias</span>: {<br><span style="color: #690color: #005cc5;">'@'</span>: <span>fileURLToPath</span>(<span style="color: #d73a49;">new</span><span>URL</span>(<span style="color: #690">'./src'</span>, <span style="color: #d73a49;">import</span>.<span style="color: #005cc5;">meta</span>.<span style="color: #005cc5;">url</span>))<br> }<br> },<br><span style="color: #005cc5;">css</span>: {<br><span style="color: #005cc5;">preprocessorOptions</span>: {<br><span style="color: #005cc5;"><del class="diff-removed">less</del></span>: {<br><span style="color: #005cc5;"><span><del class="diff-removed">javascriptEnabled</del><ins class="diff-added">AjavascriptEnabled</ins></span></span>: <span style="color: #905;">true</span>, <span style="color: #6a737d;"><span><del class="diff-removed">//注意，这一句是在less对象中，写在外边不起作用</del><ins class="diff-added">//注意，这一句是，写在外边不起作用</ins></span></span><br> },<br> },<br> },<br>})</pre></div><span class="diff-img-wrapper diff-img-wrap-added"><img src="https://cfcdn.apowersoft.info/astro/gitmind/_astro/screen-2-4.1fd8d2d6.png" style="visibility:visible;width:426px;height:522px;" data-type="inline" class="diff-img-added"></span></div></div></div>`
  // )
  engineInstance.on('blur', () => {
    console.log('engineInstance-blur', engineInstance.getHtml())
    localStorage.setItem('editorContent', engineInstance.getHtml())
    htmlStr.value = engineInstance.getHtml()
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
  overflow: auto;
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
