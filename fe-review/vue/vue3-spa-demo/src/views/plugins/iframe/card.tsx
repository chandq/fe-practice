// src/plugins/iframe/card.tsx
import {
  $,
  Card,
  CardToolbar,
  CardType,
  isEngine,
  NodeInterface,
  CardValue,
  ToolbarItemOptions
} from '@aomao/engine'
import { useFullscreen } from '@vueuse/core'
import './card.css' // 我们将为卡片添加一些样式
import { uniqueString } from 'sculp-js'

// 定义卡片值的类型接口
export interface IframeValue extends CardValue {
  src: string
  width?: number | string
  height?: number | string
}

// 使用 TSX 语法
export default class IframeCard extends Card<IframeValue> {
  // 静态属性，定义卡片名称和类型
  static cardName = 'iframe'
  static cardType = CardType.BLOCK // 块级卡片

  // UI节点
  private iframeContainer?: NodeInterface
  private input?: NodeInterface
  private placeholder?: NodeInterface
  static get schema() {
    return {
      type: 'block',
      attributes: {
        url: {
          required: true,
          value: '@url'
        }
      }
    }
  }

  /**
   * 渲染卡片工具栏
   * @returns 工具栏配置
   */
  toolbar(): Array<ToolbarItemOptions> {
    if (!isEngine(this.editor)) return []
    return [
      // {
      //   type: 'dnd' // 拖拽手柄
      // },
      // {
      //   type: 'copy' // 复制
      // },
      // {
      //   type: 'delete' // 删除
      // },
      // {
      //   type: 'node',
      //   node: (
      //     <div style="font-size: 14px; margin: 0 4px;">
      //       {this.editor.language.get('iframe', 'cardLink', 'title')}
      //     </div>
      //   )
      // },
      {
        type: 'input',
        placeholder: 'https://example.com',
        value: this.getValue().src,
        onChange: (value: string) => {
          // 实时更新URL
          this.setValue({ src: value })
        }
      }
    ]
  }

  /**
   * 渲染卡片DOM结构
   * @returns DOM节点或JSX
   */
  render(): NodeInterface | string {
    const value = this.getValue()
    console.log('iframeCard:render', value)
    // const language = this.editor.language.get('iframe', 'cardLink')

    // 主容器，设置为 contenteditable=false 防止内部被编辑
    const id = uniqueString()
    const container = $(`<div id="${id}" class="iframe-container" contenteditable="false">
          <div id="toggleFullscreen" class="iframe-toggle-fullscreen">
              <div class="svg-wrapper" style="width: 1em; height: 1em;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3v2H4v4H2V3h6zM2 21v-6h2v4h4v2H2zm20 0h-6v-2h4v-4h2v6zm0-12h-2V5h-4V3h6v6z"/></svg>
              </div
          </div>
      </div>`)

    this.iframeContainer = container
    container.on('click', (event: MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()
    })
    const { src, height } = value
    if (src) {
      // 如果有 src，则渲染 iframe
      const iframe = $(
        `<div>asdfhaha</div>
        <iframe src="${src}" id="${id}" frameborder="0" allowfullscreen="true" style="height: ${height ?? 400}px"></iframe>`
      )
      container.append(iframe)

      const targetEl = container.find(`#${id}`)
      const { isFullscreen, toggle } = useFullscreen(targetEl.get() as HTMLDivElement)
      ;(container.find('#toggleFullscreen').get() as HTMLDivElement)!.onclick = toggle

      // 增加一个遮罩层，以便在iframe之上可以选中卡片，否则点击会直接进入iframe内部
      // const mask = $(`<div class="iframe-mask"></div>`)
      // container.append(iframe).append(mask)
    }

    return container
  }
  didRender(): void {
    super.didRender()
  }
  init() {
    const { src } = this.getValue()
    super.init()
    console.log('iframeCard:init', src, this)
    // 在这里可以监听一些引擎事件
  }
}
