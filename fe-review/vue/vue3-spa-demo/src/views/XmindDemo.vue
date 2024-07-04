<template>
  <div style="position: fixed">
    <button @click="loadChildNodes">异步加载</button>
    <button @click="toggleEditState">切换编辑</button>
  </div>
  <div id="map"></div>
</template>
<script setup>
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/example'
import nodeMenu from '@mind-elixir/node-menu'
import '@mind-elixir/node-menu/dist/style.css'
import { onMounted, ref } from 'vue'
import { cloneDeep, forEachDeep, objectAssign, uniqueString } from 'sculp-js'

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
  currentSelectNode.value.expanded = true
  mind.value.refresh(mind.value.getData())
}
function init() {
  mind.value = new MindElixir({
    el: '#map',
    // mouseSelectionButton: 2,
    direction: MindElixir.RIGHT,
    draggable: true, // default true
    contextMenu: true, // default true
    toolBar: true, // default true
    // nodeMenu: false, // default true
    keypress: true, // default true
    locale: 'zh_CN', // [zh_CN,zh_TW,en,ja,pt] waiting for PRs
    overflowHidden: false, // default false
    primaryLinkStyle: 2, // [1,2] default 1
    primaryNodeVerticalGap: 15, // default 25
    primaryNodeHorizontalGap: 15, // default 65
    allowUndo: true,
    // generateMainBranch, //定义主分支连接线样式
    // generateSubBranch,  //定义子分支连接线样式
    // theme: example.theme
    before: {
      moveUpNode(el, obj) {
        console.log('moveUpNode', el, obj)
        return true
      },
      moveDownNode(el, obj) {
        console.log('moveDownNode', el, obj)
        return true
      },
      copyNode(el, obj) {
        console.log('copyNode', el, obj)
        return true
      },
      moveNodeIn(el, obj) {
        console.log('moveNodeIn', el, obj)
        return true
      },
      moveNodeBefore(el, obj) {
        console.log('moveNodeBefore', el, obj)
        return true
      },
      moveNodeAfter(el, obj) {
        console.log('moveNodeAfter', el, obj)
        return true
      },
      removeNode(el, obj) {
        console.log('removeNode', el, obj)
        return true
      },
      removeNodes(el, obj) {
        console.log('removeNodes', el, obj)
        return true
      },
      insertSibling(el, obj) {
        console.log('insertSibling', el, obj)
        if (this.currentNode.nodeObj.parent.root) {
          return false
        }
        return true
      },
      async addChild(el, obj) {
        console.log('addChild', el, obj)
        // await sleep()
        if (this.currentNode.nodeObj.parent.root) {
          return false
        }
        return true
      }
    }
  })
  console.log('example', example)
  mind.value.install(nodeMenu)
  // mind.value.init(example)

  const nodeData = {
    root: true,
    id: 'root-node',
    topic: 'root Node',
    expanded: false,
    children: [
      { id: uniqueString(), topic: `节点 ${uniqueString()}` },
      { id: uniqueString(), topic: `节点 ${uniqueString()}` }
    ]
  }
  function getNode(level, attrs) {
    const id = uniqueString()
    // console.log('level', level, id)
    const node = { expanded: false, id, topic: `节点 ${id}`, aa: uniqueString(), ...attrs }
    // if (level <= 2) {
    //   node.style = { background: '#bdc3c7' }
    // }
    return node
  }
  let count = 0
  // 横向不限层级测试正常的最高记录：687个node节点（400）出现递归栈溢出 Maximum call stack size exceeded
  // 横向限制最高5级测试正常的正常记录：5000个node节点, 渲染时间：2s,占用内存：30-50MB, 界面响应很流畅
  // 横向限制最高5级测试正常的正常记录：8000个node节点, 渲染时间：3s,占用内存：70MB, 界面响应很流畅
  forEachDeep(nodeData.children, (item, i, cur, tree, parent, level) => {
    ++count
    // console.log('current::', level)

    if (count <= 5) {
      if (level <= 5 && !item.children) {
        item.children = [
          {
            ...getNode(level, { tags: [uniqueString(), uniqueString()] })
          }
        ]
        // item.parent = parent
      }
      if (level <= 5 && parent) {
        !parent.children && (parent.children = [{ ...getNode(level, {}) }])
        if (parent.children?.length < 50) {
          parent.children.push({ ...getNode(level, {}) })
        }
      } else if (level <= 5 && item.children?.length < 50) {
        item.children.push({ ...getNode(level, {}) })
      } else if (level <= 5) {
        tree.push({ ...getNode(level, {}) })
      }
    }
  })
  const mindData = { nodeData, theme: example.theme, arrows: example.arrows }

  // let j = 0
  // forEachDeep(mindData.nodeData.children, (item, i, cur, tree, parent, level) => {
  //   console.log('iter::', j++, level)
  // })
  let k = 0
  forEachDeep(mindData.nodeData.children, (item, i, cur, tree, parent, level) => {
    // console.log('clone-iter::', k++, item.id, level)
    if (level <= 2) {
      item.style = { background: '#bdc3c7' }
    }
  })
  // mind.value.init(example)
  console.log('mindData', mindData, cloneDeep(mindData).nodeData.children)
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
const isEdit = ref(true)
function toggleEditState() {
  if (isEdit.value) {
    mind.value.draggable = false
    mind.value.disableEdit()
  } else {
    mind.value.enableEdit()
    mind.value.draggable = true
  }

  mind.value.refresh()
  // isEdit.value ? mind.value.disableEdit() : mind.value.enableEdit()
  isEdit.value = !isEdit.value
  console.log('toggleEditState', isEdit.value, mind.value)
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
      // me.value.undo()
    }
  })
})

function generateMainBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, containerHeight }) {
  let x1 = pL + pW / 2
  const y1 = pT + pH / 2
  let x2
  if (direction === 'lhs') {
    x2 = cL + cW
  } else {
    x2 = cL
  }
  const y2 = cT + cH / 2
  const root = this.map.querySelector('me-root')
  if (this.direction === MindElixir.SIDE) {
    if (direction === 'lhs') {
      x1 = x1 - root.offsetWidth / 8
    } else {
      x1 = x1 + root.offsetWidth / 8
    }
  }
  return `M ${x1} ${y1} V ${
    y2 > y1 ? y2 - 20 : y2 + 20
  } C ${x1} ${y2} ${x1} ${y2} ${x2 > x1 ? x1 + 20 : x1 - 20} ${y2} H ${x2}`
}
function generateSubBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }) {
  const GAP = 30
  const TURNPOINT_R = 8
  let y1
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMiddle = 0
  if (direction === 'lhs') {
    x1 = pL + GAP
    x2 = cL
    xMiddle = cL + cW
  } else if (direction === 'rhs') {
    x1 = pL + pW - GAP
    x2 = cL + cW
    xMiddle = cL
  }

  if (y2 < y1 + 50 && y2 > y1 - 50) {
    // draw straight line if the distance is between +-50
    return `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
  } else if (y2 >= y1) {
    // child bottom lower than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${
      y2 - TURNPOINT_R
    } A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 1 : 0} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  } else {
    // child bottom higher than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${
      y2 + TURNPOINT_R
    } A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 0 : 1} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  }
}
</script>
<style lang="less" scoped>
#map {
  width: 1180px;
  height: 900px;
}
</style>
