<template>
  <button @click="loadChildNodes">模拟异步加载子节点</button>
  <div id="map"></div>
</template>
<script setup>
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/example'
import nodeMenu from '@mind-elixir/node-menu'
import '@mind-elixir/node-menu/dist/style.css'
import { onMounted, ref } from 'vue'
import { forEachDeep, uniqueString } from 'sculp-js'

const mind = ref()
const currentSelectNode = ref()
function loadChildNodes() {
  // console.log('async load Node', currentSelectNode)
  currentSelectNode.value.children = [
    ...new Array(10).fill('').map((el) => ({
      parent: currentSelectNode.value,
      id: uniqueString(),
      topic: `节点 ${uniqueString()}`
    }))
  ]
  mind.value.refresh(mind.value.getData())
}
function init() {
  mind.value = new MindElixir({
    el: '#map',
    toolBar: true,
    mouseSelectionButton: 2,
    direction: MindElixir.LEFT,
    draggable: true, // default true
    contextMenu: true, // default true
    toolBar: true, // default true
    nodeMenu: true, // default true
    keypress: true, // default true
    locale: 'zh_CN', // [zh_CN,zh_TW,en,ja,pt] waiting for PRs
    overflowHidden: false, // default false
    primaryLinkStyle: 2, // [1,2] default 1
    primaryNodeVerticalGap: 15, // default 25
    primaryNodeHorizontalGap: 15, // default 65
    allowUndo: true
  })
  // console.log('example', example)
  mind.value.install(nodeMenu)
  // mind.value.init(example)

  const nodeData = {
    root: true,
    id: 'root-node',
    topic: 'root Node',
    children: [{ id: uniqueString(), topic: `节点 ${uniqueString()}` }]
  }
  let count = 0
  // 横向不限层级测试正常的最高记录：687个node节点（400）出现递归栈溢出 Maximum call stack size exceeded
  // 横向限制最高5级测试正常的正常记录：5000个node节点, 渲染时间：2s,占用内存：30-50MB, 界面响应很流畅
  // 横向限制最高5级测试正常的正常记录：8000个node节点, 渲染时间：3s,占用内存：70MB, 界面响应很流畅
  forEachDeep(nodeData.children, (item, i, cur, tree, parent, level) => {
    ++count
    // console.log('current::', level)

    if (count <= 100) {
      if (level <= 5 && !item.children) {
        item.children = [
          {
            parent: item,
            id: uniqueString(),
            topic: `节点 ${uniqueString()}`,
            tags: [uniqueString(), uniqueString()]
          }
        ]
        item.parent = parent
      }
      if (level <= 5 && parent) {
        !parent.children &&
          (parent.children = [
            { parent: item, id: uniqueString(), topic: `节点 ${uniqueString()}` }
          ])
        if (parent.children?.length < 50) {
          parent.children.push({
            parent: item,
            id: uniqueString(),
            topic: `节点 ${uniqueString()}`
          })
        }
      } else if (level <= 5 && item.children?.length < 50) {
        item.children.push({ parent: item, id: uniqueString(), topic: `节点 ${uniqueString()}` })
      } else if (level <= 5) {
        tree.push({ id: uniqueString(), topic: `节点 ${uniqueString()}` })
      }
    }
  })
  const mindData = { nodeData, direction: 2, theme: example.theme, arrows: example.arrows }

  mind.value.init(mindData)
  // mind.value.init(MindElixir.new('中心主题'))

  // document.querySelector('#map').addEventListener('keypress', evt => {
  // console.log('evt', evt);
  // console.log(
  //   'mindData',
  //   count,
  //   mindData,
  //   mind.value.getData(),
  //   mind.value.getDataString(),
  //   mind.value.getDataMd()
  // )
}
onMounted(() => {
  init()

  mind.value.bus.addListener('operation', (operation, ...args) => {
    // console.log('operation::', operation, args, me.value)
    // emit('dataChange', mindMap.value.getAllDataString());
  })

  document.addEventListener('mousedown', (evt) => {
    console.log('mousedown', evt.button)
  })

  mind.value.bus.addListener('selectNode', (node) => {
    // console.log(node, mind.value)
    currentSelectNode.value = node
    console.log('currentSelectNode', currentSelectNode)
  })

  mind.value.bus.addListener('expandNode', (node) => {
    // console.log('expandNode: ', node)
  })

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.keyCode === 67) {
      console.log('Ctrl+c')
      me.value.undo()
    }
  })
})
</script>
<style lang="less" scoped>
#map {
  width: 1180px;
  height: 900px;
}
</style>
