// src/plugins/iframe/index.ts
import { $, CARD_KEY, CARD_VALUE_KEY, Element, Plugin, READY_CARD_KEY, decodeCardValue, encodeCardValue, isEngine, type NodeInterface, type PluginOptions, type SchemaInterface } from '@aomao/engine';
import IframeComponent, { type IframeValue } from './card';
import { createApp } from 'vue';
import SelectModal from '../components/SelectModal.vue';

export interface IframeOptions extends PluginOptions {
  // 可以在这里为插件定义一些配置项
}

const PARSER_VALUE = 'parse:value';
const PARSER_NODE = 'parse:node';
const PARSER_HTML = 'parse:html';
const PASTE_SCHEMA = 'paste:schema';
const PASTE_EACH = 'paste:each';

export default class IframePlugin extends Plugin<IframeOptions> {
  static get pluginName() {
    return 'iframe';
  }

  execute(src?: string) {
    const editor = this.editor;
    const { change } = editor;
    const savedRange = change.range.get().cloneRange();
    console.log('change:be', change, change.range.get().cloneRange());
    const vm = createApp(SelectModal, {
      onSubmit: (formData) => {
        console.log('formData', formData, formData.url, this, editor)

        change.range.select(savedRange);
        const component = editor.card.insert<IframeValue>(IframeComponent.cardName, {
          src: formData.url,
          height: 600
        })
        editor.trigger('iframe:insert', component);
        // Move cursor after the inserted card
        if (isEngine(editor)) {
          const cardRoot = component.root.get();
          if (cardRoot) {
            const newRange = change.range.get().cloneRange();
            newRange.setStartAfter(cardRoot);
            newRange.collapse(true);
            change.range.select(newRange);
          }
        }
        setTimeout(() => {
          vm.unmount()
        })
      },
      onCancel: () => {
        vm.unmount()

      }
    })
    const modalWrapperEl = document.querySelector('.select-content-wrapper')
    if (modalWrapperEl) {
      vm.mount(modalWrapperEl)
    } else {
      const SelectContentWrapper = document.createElement('div')
      SelectContentWrapper.className = 'select-content-wrapper'
      document.querySelector('.editor-container')!.appendChild(SelectContentWrapper)

      vm.mount(SelectContentWrapper)
    }

  }

  init() {
    console.log('iframe-init', this)
    // 在这里可以监听一些引擎事件

    const editor = this.editor;
    editor.on(PARSER_VALUE, this.parseValue);
    editor.on(PARSER_NODE, this.parseNode);
    editor.on(PARSER_HTML, this.parseHtml);
    editor.on(PASTE_EACH, this.pasteHtml);
    editor.on(PASTE_SCHEMA, this.pasteSchema);
  }
  pasteSchema = (schema: SchemaInterface) => {
    schema.add({
      type: 'block',
      name: 'div',
      attributes: {
        'data-type': {
          required: true,
          value: IframeComponent.cardName,
        },
        'data-value': '*',
      },
    });

    return schema;
  };
  parseValue = (node: NodeInterface) => {
    if (node.isCard() && node.attributes('name') === IframeComponent.cardName) {
      const value = node.attributes('value');
      const cardValue = decodeCardValue(value);
      if (!cardValue || !cardValue['src']) return false;
    }
    return true;
  };

  parseNode = (node: Node) => {
    if (Element.isElement(node) && (node as any)[CARD_KEY] === IframeComponent.cardName) {
      const value = (node as any)[CARD_VALUE_KEY];
      const cardValue = decodeCardValue(value);
      if (!cardValue || !cardValue['src']) return false;
    }
    return true;
  };
  pasteHtml = (node: NodeInterface) => {
    const editor = this.editor;
    if (!isEngine(editor)) return;
    if (node.isElement()) {
      const attributes = node.attributes();
      const type = attributes['data-type'];
      if (type && type === IframeComponent.cardName) {

        const value = attributes['data-value'];
        const cardValue = decodeCardValue<IframeValue>(value);
        if (!cardValue.src) return;
        editor.card.replaceNode(node, IframeComponent.cardName, cardValue);
        node.remove();
        return false;
      }
    }
    return true;
  };

  parseHtml = (root: NodeInterface, callback?: (node: NodeInterface, value) => NodeInterface) => {
    console.log('parseHtml', root);
    const editor = this.editor;
    const results: NodeInterface[] = [];
    root
      .find(`[${CARD_KEY}="${IframeComponent.cardName}"],[${READY_CARD_KEY}="${IframeComponent.cardName}"]`)
      .each(cardNode => {
        const node = $(cardNode);
        const card = editor.card.find<IframeValue, IframeComponent>(node);
        const value = card?.getValue() || decodeCardValue(node.attributes(CARD_VALUE_KEY));
        console.log('value', value);
        if (value?.src) {
          // Generate proper iframe HTML representation
          const iframeHtml = `<span>saa
          <span>`;

          // const containerHtml = `<div  data-type="${IframeComponent.cardName}" class="iframe-container"  data-value="${encodeCardValue(value)}">${iframeHtml}</div>`;
          const containerHtml = `<div  data-type="${IframeComponent.cardName}" class="iframe-container"  data-value="${encodeCardValue(value)}">${iframeHtml}</div>`;

          let newNode = $(containerHtml);
          if (callback) {
            newNode = callback(newNode, value);
          }
          node.replaceWith(newNode);
          results.push(newNode);

        } else node.remove();
      });
    return results;
  };


  destroy() {
    const editor = this.editor;
    editor.off(PARSER_VALUE, this.parseValue);
    editor.off(PARSER_NODE, this.parseNode);
    editor.off(PARSER_HTML, this.parseHtml);
    editor.off(PASTE_EACH, this.pasteHtml);
    editor.off(PASTE_SCHEMA, this.pasteSchema);

  }

}