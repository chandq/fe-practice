interface BackendNode {
  name: string
  transitions: { to_flow_state_name: string }[]
}

interface BaseFrontendNode {
  nodeName: string
  type: number  // 1: 普通节点, 2: 抄送人, 3: 条件节点, 4: 分支节点
  childNode: FrontendNode | null
}

interface BranchNode extends BaseFrontendNode {
  type: 4
  conditionNodes: FrontendNode[]
}

type FrontendNode = BaseFrontendNode | BranchNode

// 标记已被使用过的节点
// 由于分支合并后的节点可能被多个分支引用，所以需要标记已被使用过的节点
const usedNodes = new Set<string>()

function convertFlow(backendData: BackendNode[]): FrontendNode {
  const backendNodes = new Map<string, BackendNode>()
  for (const node of backendData) {
    backendNodes.set(node.name, node)
  }
  // 获取所有的指向节点
  const toNodeNames = backendData.map(node => node.transitions.map(transition => transition.to_flow_state_name)).flat()
  // 找到起始节点
  const startingNodes = backendData.filter(node => !toNodeNames.includes(node.name))
  if (startingNodes.length !== 1) {
    throw new Error("应该有且仅有一个开始节点。")
  }
  const startNode = startingNodes[0]

  // 按正常逻辑组装前端结构
  function buildFrontendNode(nodeName: string): FrontendNode {
    const backendNode = backendNodes.get(nodeName)
    if (!backendNode) {
      throw new Error(`找不到节点 ${nodeName}`)
    }

    let type: number
    // TODO 改为实际逻辑
    if (nodeName === "抄送人") {
      type = 2; // 抄送人节点
    } else {
      type = 1; // 普通节点
    }

    const transitions = backendNode.transitions

    let frontendNode: FrontendNode

    if (transitions.length === 0) {
      // 当后端返回节点的transitions为空时，childNode为空
      frontendNode = {
        nodeName: nodeName,
        type: type,
        childNode: null
      }
    } else if (transitions.length === 1) {
      // 当后端返回节点的transitions为1条时，childNode为transitions[0].to_flow_state_name的节点
      frontendNode = {
        nodeName: nodeName,
        type: type,
        // 已被使用的节点不再创建
        childNode: usedNodes.has(transitions[0].to_flow_state_name) ? null : buildFrontendNode(transitions[0].to_flow_state_name)
      }
    } else {
      // 当后端返回节点的transitions大于1条时，childNode为添加一个nodeName=路由,type=4的分支节点，然后在这个分支节点的conditionNodes中添加transitions指向的节点
      // 找到分支汇聚节点
      const convergingNodeName = findConvergingNodes(backendNodes, nodeName)[0]
      // 已被使用的节点不再创建
      const childNode = usedNodes.has(convergingNodeName) ? null : buildFrontendNode(convergingNodeName)
      usedNodes.add(convergingNodeName)
      const branchNode: BranchNode = {
        nodeName: "路由",
        type: 4,
        childNode: childNode,
        conditionNodes: transitions.map(transition => buildFrontendNode(transition.to_flow_state_name))
      }

      frontendNode = {
        nodeName: nodeName,
        type: type,
        childNode: branchNode
      }

    }
    return frontendNode
  }
  return buildFrontendNode(startNode.name)
}

// 找到汇聚节点
function findConvergingNodes(backendNods: Map<string, BackendNode>, startNodeName: string): string[] {
  const startNode = backendNods.get(startNodeName)
  if (!startNode) {
    return []
  }

  const branches = startNode.transitions.map((t) => t.to_flow_state_name)

  // 对于每个直接分支，使用 DFS 遍历能够到达的所有节点，结果存储在一个集合 visited 中，以避免重复
  const reachableSets = branches.map((branchName) => {
    const visited = new Set<string>()
    // 深度优先搜索
    function dfs(nodeName: string) {
      if (visited.has(nodeName)) {
        return
      }
      visited.add(nodeName)
      const node = backendNods.get(nodeName)
      if (node && node.transitions) {
        node.transitions.forEach((t) => {
          dfs(t.to_flow_state_name)
        })
      }
    }
    dfs(branchName)
    return visited
  })

  // 计算所有分支可达节点的交集
  if (reachableSets.length === 0) {
    return []
  }

  let intersection = reachableSets[0]
  for (let i = 1; i < reachableSets.length; i++) {
    // 获取两个集合的交集
    intersection = new Set([...intersection].filter((x) => reachableSets[i].has(x)))
  }

  return [...intersection]
}


// Sample data test
const backendDataSample: BackendNode[] = [
  {
    "name": "审核人007",
    "transitions": [
      {
        "to_flow_state_name": "条件1"
      },
      {
        "to_flow_state_name": "条件2"
      }
    ]
  },
  {
    "name": "条件1",
    "transitions": [
      {
        "to_flow_state_name": "left-审核人"
      }
    ]
  },
  {
    "name": "条件2",
    "transitions": [
      {
        "to_flow_state_name": "right-条件1"
      },
      {
        "to_flow_state_name": "right-条件2"
      }
    ]
  },
  {
    "name": "left-审核人",
    "transitions": [
      {
        "to_flow_state_name": "left-条件1"
      },
      {
        "to_flow_state_name": "left-条件2"
      }
    ]
  },
  {
    "name": "left-条件1",
    "transitions": [
      {
        "to_flow_state_name": "抄送人"
      }
    ]
  },
  {
    "name": "left-条件2",
    "transitions": [
      {
        "to_flow_state_name": "抄送人"
      }
    ]
  },
  {
    "name": "right-条件1",
    "transitions": [
      {
        "to_flow_state_name": "审核人"
      }
    ]
  },
  {
    "name": "right-条件2",
    "transitions": [
      {
        "to_flow_state_name": "right2-条件1"
      },
      {
        "to_flow_state_name": "right2-条件2"
      }
    ]
  },
  {
    "name": "right2-条件1",
    "transitions": [
      {
        "to_flow_state_name": "审核人"
      }
    ]
  },
  {
    "name": "right2-条件2",
    "transitions": [
      {
        "to_flow_state_name": "审核人"
      }
    ]
  },
  {
    "name": "审核人",
    "transitions": [
      {
        "to_flow_state_name": "抄送人"
      }
    ]
  },
  {
    "name": "抄送人",
    "transitions": []
  }
]

// const backendNodes = new Map<string, BackendNode>()
// for (const node of backendDataSample) {
//     backendNodes.set(node.name, node)
// }
// // const ss = findConvergingNodes(backendNodes, "right-条件2")
// // console.log(ss)


const frontendData = convertFlow(backendDataSample)
console.log(JSON.stringify(frontendData, null, 4))
