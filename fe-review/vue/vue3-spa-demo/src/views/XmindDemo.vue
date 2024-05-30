<template>
  <div id="map"></div>
</template>
<script setup>
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/example'
import nodeMenu from '@mind-elixir/node-menu'
import '@mind-elixir/node-menu/dist/style.css'
import { onMounted, ref } from 'vue'
import { forEachDeep, uniqueString } from 'sculp-js'

const me = ref()
onMounted(() => {
  me.value = new MindElixir({
    el: '#map',
    toolBar: false,
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
  console.log('example', example)
  me.value.install(nodeMenu)
  // me.value.init(example)

  const nodeData = {
    root: true,
    id: 'root-node',
    topic: 'root Node',
    children: [{ id: uniqueString(), topic: `节点 ${uniqueString()}` }]
  }
  let count = 0
  // 测试正常的最高记录：687个node节点（400）出现递归栈溢出
  forEachDeep(nodeData.children, (item, i, cur, tree, parent, level) => {
    ++count
    console.log('current::', level)

    if (count <= 450) {
      if (level <= 5 && !item.children) {
        item.children = [{ parent: item, id: uniqueString(), topic: `节点 ${uniqueString()}` }]
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
  console.log('mindData', count, mindData)

  me.value.init(mindData)
  // me.value.init(MindElixir.new('中心主题'))

  // document.querySelector('#map').addEventListener('keypress', evt => {
  // console.log('evt', evt);
  me.value.bus.addListener('operation', (operation) => {
    console.log(me.value)
    // emit('dataChange', mindMap.value.getAllDataString());
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
