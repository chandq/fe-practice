<template>
  <button @click="loadChildNodes">模拟异步加载子节点</button>

  <div id="map2"></div>

  <Contextmenu v-if="mindMap" :mindMap="mindMap"></Contextmenu>
  <RichTextToolbar v-if="mindMap" :mindMap="mindMap"></RichTextToolbar>
</template>
<script setup>
import MindMap from 'simple-mind-map'
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js'
import Watermark from 'simple-mind-map/src/plugins/Watermark.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import ExportXMind from 'simple-mind-map/src/plugins/ExportXMind.js'
import Export from 'simple-mind-map/src/plugins/Export.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import RichText from 'simple-mind-map/src/plugins/RichText.js'
import AssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine.js'
import TouchEvent from 'simple-mind-map/src/plugins/TouchEvent.js'
import NodeImgAdjust from 'simple-mind-map/src/plugins/NodeImgAdjust.js'
import SearchPlugin from 'simple-mind-map/src/plugins/Search.js'
import Painter from 'simple-mind-map/src/plugins/Painter.js'
import ScrollbarPlugin from 'simple-mind-map/src/plugins/Scrollbar.js'
import Formula from 'simple-mind-map/src/plugins/Formula.js'
import RainbowLines from 'simple-mind-map/src/plugins/RainbowLines.js'
import Demonstrate from 'simple-mind-map/src/plugins/Demonstrate.js'

import { onMounted, ref } from 'vue'
import { forEachDeep, uniqueString, isObject } from 'sculp-js'
import eventBus from '@/utils/eventBus'

// 注册插件
MindMap.usePlugin(MiniMap)
  // .usePlugin(Watermark)
  .usePlugin(Drag)
  // .usePlugin(KeyboardNavigation)
  // .usePlugin(ExportPDF)
  // .usePlugin(ExportXMind)
  .usePlugin(Export)
  .usePlugin(Select)
  .usePlugin(AssociativeLine)
  .usePlugin(NodeImgAdjust)
  .usePlugin(TouchEvent)
  .usePlugin(SearchPlugin)
  .usePlugin(Painter)
  .usePlugin(Formula)
  .usePlugin(RainbowLines)
  .usePlugin(Demonstrate)
// .usePlugin(Cooperate) // 协同插件

// 注册自定义主题
// customThemeList.forEach((item) => {
//   MindMap.defineTheme(item.value, item.theme)
// })

const exampleData = {
  // ...data1,
  // ...data2,
  // ...data3,
  // ...data4,
  // ...data5,
  // ...rootData,
  theme: {
    template: 'classic4',
    config: {
      // 自定义配置...
    }
  },
  layout: 'logicalStructure',
  // "layout": "mindMap",
  // "layout": "catalogOrganization"
  // "layout": "organizationStructure",
  config: {}
}
const layout = exampleData.layout
const theme = exampleData.theme

const mindMap = ref()
const currentSelectNode = ref()
function loadChildNodes() {
  // console.log('currentSelectNode', currentSelectNode)
  currentSelectNode.value.children = [
    ...new Array(10)
      .fill('')
      .map((el) => ({ data: { text: `节点 ${uniqueString()}`, tag: [uniqueString()] } }))
  ]
  mindMap.value.reRender()
}
onMounted(() => {
  init()
  eventBus.on('startTextEdit', handleStartTextEdit)
  eventBus.on('endTextEdit', handleEndTextEdit)
})
function init() {
  const mindData = [{ data: { text: 'node1' } }]
  let count = 0
  forEachDeep(mindData, (item, i, cur, tree, parent, level) => {
    ++count
    // console.log('current::', level)
    // 横向不限层级测试正常的最高记录：2059个node节点（1200）,深拷贝报错
    // 横向限制最高5级测试正常的正常记录：2000个node节点， 50MB，15s，界面响应流程
    // 横向限制最高5级测试正常的正常记录：5000个node节点， 100-150MB，15s，CPU长时间占用100%以上，界面响应明显卡顿
    if (count <= 10) {
      if (level <= 5 && !item.children) {
        item.children = [
          { data: { text: `节点 ${uniqueString()}`, tag: [uniqueString(), uniqueString()] } }
        ]
      }
      if (level <= 5 && parent) {
        !parent.children && (parent.children = [{ data: { text: `节点 ${uniqueString()}` } }])
        if (parent.children?.length < 50) {
          parent.children.push({ data: { text: `节点 ${uniqueString()}` } })
        }
      } else if (level <= 5 && item.children?.length < 50) {
        item.children.push({ data: { text: `节点 ${uniqueString()}` } })
      } else if (level <= 5) {
        tree.push({ data: { text: `节点 ${uniqueString()}` } })
      }
    }
  })
  // console.log('mindData', count, mindData)
  // let j = 0
  // forEachDeep(mindData, (item, i, cur, tree, parent, level) => {
  //   console.log('iter::', j++, level)
  // })

  mindMap.value = new MindMap({
    el: document.getElementById('map2'),
    layout: layout,
    theme: theme.template,
    themeConfig: theme.config,
    enableAutoEnterTextEditWhenKeydown: true,
    data: {
      data: {
        text: '根节点'
      },
      children: mindData
    }
  })
  // 转发事件
  ;[
    'node_active',
    'data_change',
    'view_data_change',
    'back_forward',
    'node_contextmenu',
    'node_click',
    'draw_click',
    'expand_btn_click',
    'svg_mousedown',
    'mouseup',
    'mode_change',
    'node_tree_render_end',
    'rich_text_selection_change',
    'transforming-dom-to-images',
    'generalization_node_contextmenu',
    'painter_start',
    'painter_end',
    'scrollbar_change',
    'scale',
    'translate',
    'node_attachmentClick',
    'node_attachmentContextmenu',
    'demonstrate_jump',
    'exit_demonstrate'
  ].forEach((event) => {
    console.log('register:event', event)
    mindMap.value.on(event, (...args) => {
      // const nodeData = args[0].nodeData
      // console.log('event:on', event, args)
      if (args?.length === 2 && isObject(args[0]) && args[1] instanceof PointerEvent) {
        // console.log('event:on', event, args[0], args[0].getData(), args[0].getData('text'))
      }
      if (event === 'node_click') {
        currentSelectNode.value = args[0].nodeData
      }
      eventBus.emit(event, ...args)
    })
  })
  mindMap.value.addPlugin(RichText)
  // console.log('mindMap', mindMap.value, MindMap)
}

function handleStartTextEdit() {
  // console.log('handleStartTextEdit', handleStartTextEdit)
  mindMap.value.renderer.startTextEdit()
}

function handleEndTextEdit() {
  mindMap.value.renderer.endTextEdit()
}
</script>
<style lang="less" scoped>
#map2 {
  width: 1180px;
  height: 900px;
}
</style>
