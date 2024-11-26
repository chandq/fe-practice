<template>
  <div class="collapse-btns-container" v-if="data.length === 1" @click="btnEventHandler">
    <template v-for="(item, index) in data[0]" :key="item.name">
      <i
        v-if="item.icon"
        :disabled="item.disabled"
        :class="`iconfont icon-${item.icon}`"
        :title="item.name"
        :name="item.name"
        :data-index="index"
      ></i>
      <span v-else class="text-button" :disabled="item.disabled" :data-index="index">
        {{ item.name }}
      </span>
    </template>
  </div>
  <div class="collapse-btns-container" v-else-if="data.length > 1" @click="btnEventHandler">
    <template v-for="(item, index) in data[0]" :key="item.name">
      <i
        v-if="item.icon"
        :disabled="item.disabled"
        :class="`iconfont icon-${item.icon}`"
        :title="item.name"
        :data-index="index"
      ></i>
      <span v-else class="text-button" :disabled="item.disabled" :data-index="index">
        {{ item.name }}
      </span>
    </template>
    <span
      v-if="opts.trigger === 'hover'"
      class="text-button"
      @pointerenter="hoverBtnPointerEnter"
      @pointerleave="hoverBtnPointerLeave"
    >
      <slot>
        <span class="cursor-pointer text-button">更多</span>
      </slot>
    </span>
    <span v-else class="text-button">
      <slot>
        <span class="cursor-pointer text-button">更多</span>
      </slot>
    </span>
  </div>
</template>
<!--
 * 折叠按钮，支持表格内折叠按钮和单独popover按钮两种模式使用
 * @Date: 2023-01-14 10:01:04
 * @LastEditors: chendq
 * @LastEditTime: 2023-01-14 14:58:46
 * @Author      : chendq
-->
<script lang="ts" setup>
import { ref, shallowRef, onBeforeUnmount, watch, useSlots } from 'vue';
import { isFunction, hasClass, getComputedCssVal } from 'sculp-js';
import { onClickOutside } from '@vueuse/core';

export interface IOption {
  isHidden?: boolean;
  showArrow?: boolean;
  showNum: number;
  trigger?: 'hover' | 'click';
  placement?: 'left' | 'center'; // 水平对齐方式
}
export interface IButtonData {
  icon: string;
  name: string | Function;
  handler: Function;
  disabled: Boolean | Function;
  // permCode: string;
  isShow?: Function;
}
// 默认值
const defaultOptions: IOption = {
  isHidden: true,
  showNum: 3,
  trigger: 'hover',
  placement: 'left',
  showArrow: true
};
const props = withDefaults(
  defineProps<{
    btnData: IButtonData[]; // 按钮组数据
    scope: Object; // 作用域
    option?: IOption; // 按钮组配置项
  }>(),
  {
    scope: () => ({}),
    btnData: () => [],
    option: () => ({
      isHidden: true,
      showNum: 3,
      trigger: 'hover',
      placement: 'left'
    })
  }
);
const data: any = ref([]);
const opts = shallowRef<IOption>(defaultOptions);
const collapseButtonWrapperId = 'collapse1700288477580';

/**
 * dropdown下拉面板内按钮代理事件句柄
 * @param {*} evt
 * @returns {*}
 */
const btnEventHandler = evt => {
  let eventTarget: HTMLElement | null = evt.target as HTMLElement;
  if (hasClass(eventTarget, 'collapse-btns-container')) {
    return;
  }
  if (eventTarget?.dataset.index === void 0) {
    if (opts.value.trigger === 'hover') {
      return;
    }
    createPopoverEl(eventTarget);
    return;
  }
  let item = data.value.flat()[+eventTarget?.dataset.index];
  if (!!item.disabled) {
    return;
  }
  item.handler(props.scope, evt);
  eventTarget = null;
  item = null;
  evt.stopPropagation();

  const ul = document.querySelector(`#${collapseButtonWrapperId}`);
  if (ul) {
    destroyUlEventListener(ul as HTMLElement);
  }
};
const showPopover = ref(false);

/**
 * dropdown下拉面板enter事件句柄
 */
function ulPointerEnter(ev) {
  showPopover.value = true;
}
/**
 * dropdown下拉面板leave事件句柄
 */
function ulPointerLeave(ev) {
  if (opts.value.trigger !== 'hover') {
    return;
  }
  showPopover.value = false;
  setTimeout(() => {
    const ul = document.querySelector(`#${collapseButtonWrapperId}`);
    if (!showPopover.value) {
      if (ul) {
        destroyUlEventListener(ul as HTMLElement);
      }
    }
  }, 50);
}
/**
 * dropdown触发按钮enter事件句柄
 */
function hoverBtnPointerEnter(evt) {
  if (opts.value.trigger !== 'hover') {
    return;
  }
  console.assert(evt.target.children.length <= 1, '[collapse-button] hover模式下必须保证默认插槽最多只有一个根节点');
  showPopover.value = true;
  setTimeout(() => {
    if (showPopover.value) {
      createPopoverEl(evt.target.children?.[0] ?? evt.target);
    }
  }, 50);
}
/**
 * 销毁popover面板的事件
 * @param ul HTMLElement
 */
function destroyUlEventListener(ul: HTMLElement) {
  ul.removeEventListener('click', btnEventHandler);
  ul.removeEventListener('pointerenter', ulPointerEnter);
  ul.removeEventListener('pointerleave', ulPointerLeave);
  ul.remove();
}

/**
 * dropdown触发按钮leave事件句柄
 */
function hoverBtnPointerLeave() {
  if (opts.value.trigger !== 'hover') {
    return;
  }
  showPopover.value = false;
  setTimeout(() => {
    const ul = document.querySelector(`#${collapseButtonWrapperId}`);
    if (!showPopover.value) {
      if (ul) {
        destroyUlEventListener(ul as HTMLElement);
      }
    }
  }, 50);
}

/**
 * 原生实现popover面板功能
 * @return {*}
 */
function createPopoverEl(eventTarget: HTMLElement) {
  const collapseButtonWrapper = document.querySelector(`#${collapseButtonWrapperId}`);
  if (collapseButtonWrapper) {
    destroyUlEventListener(collapseButtonWrapper as HTMLElement);
  }
  const fragment = new DocumentFragment();
  const ul = document.createElement('ul');
  ul.setAttribute('id', collapseButtonWrapperId);
  fragment.appendChild(ul);
  // @ts-ignore
  const closetMicroAppRootEl = eventTarget?.closest('micro-app');

  const { left, top, bottom, width, height, right } = eventTarget.getBoundingClientRect();
  let ulMarginLeft = 0,
    ulMarginTop = 6;
  // 解决拖拽过程中因嵌入微前端框架micro-app中主子应用左侧栏的偏移宽度问题
  if (closetMicroAppRootEl) {
    const { left, top } = closetMicroAppRootEl.getBoundingClientRect();
    ulMarginLeft += -left;
    ulMarginTop += -top;
  }

  ul.classList.add('collapse-btns-popover');
  data.value[1].forEach((obj, i) => {
    const index = data.value[0].length + i;
    const li = document.createElement('li');
    li.setAttribute('data-index', index);
    if (obj.disabled) {
      li.setAttribute('disabled', 'disabled');
    }
    // 按钮图标
    if (obj.icon) {
      const i = document.createElement('i');
      i.setAttribute('data-index', index);
      i.classList.add(`iconfont`, `icon-${obj.icon}`, `collapse-btns-icon`);
      i.setAttribute('title', obj.name);
      if (obj.disabled) {
        i.setAttribute('disabled', 'disabled');
      }
      li.appendChild(i);
    }
    // 按钮名称
    const span = document.createElement('span');
    span.setAttribute('data-index', index);
    span.classList.add('text-button');
    if (obj.disabled) {
      span.setAttribute('disabled', 'disabled');
    }
    span.textContent = obj.name;
    li.appendChild(span);
    ul.appendChild(li);
  });
  ul.style.cssText = `position: absolute; left: ${left.toFixed()}px;top: ${top.toFixed()}px; margin-left: ${ulMarginLeft}px; margin-top: ${ulMarginTop}px; transform: translateX(${
    opts.value.placement === 'center' ? (width / 2 - (getComputedCssVal(ul, 'width', true) as number) / 2).toFixed() : 0
  }px);z-index:99999;`;

  ul.addEventListener('click', btnEventHandler);
  if (opts.value.trigger === 'hover') {
    ul.addEventListener('pointerenter', ulPointerEnter);
    ul.addEventListener('pointerleave', ulPointerLeave);
  }
  document.body.appendChild(fragment);
  const {
    left: ulLeft,
    width: ulWidth,
    height: ulHeight,
    right: ulRight,
    bottom: ulBottom
  } = ul.getBoundingClientRect();

  ul.style.cssText =
    `position: absolute; visibility:visible;  margin-left: ${ulMarginLeft}px; margin-top: ${ulMarginTop}px; z-index:9999999;` +
    calculateUlStyle(
      { left, right, top, bottom, width, height },
      { l: ulLeft, w: ulWidth, h: ulHeight, r: ulRight, b: ulBottom },
      eventTarget
    );

  if (opts.value.trigger === 'click') {
    onClickOutside(ref(ul), event => {
      if ((event?.target as HTMLElement)?.closest(`#${collapseButtonWrapperId}`)) {
        return;
      }

      const ul = document.querySelector(`#${collapseButtonWrapperId}`);
      if (ul) {
        destroyUlEventListener(ul as HTMLElement);
      }
    });
  }
}

/**
 * 计算更多按钮外层元素的位置
 * @param {*} left
 * @param {*} right
 * @param {*} top
 * @param {*} bottom
 * @param {*} r
 * @param {*} b
 * @return {*}
 */
function calculateUlStyle(
  { left, right, top, bottom, width: targetWidth, height: targetHeight },
  { l, w, h, r, b },
  eventTarget
): string {
  let scrollLeft = document.documentElement.scrollLeft | document.body.scrollLeft,
    scrollTop = document.documentElement.scrollTop | document.body.scrollTop;
  const closetMicroAppBodyEl = eventTarget.closest('micro-app');
  // 兼容@micro-zoe/micro-app框架的微前端架构场景
  if (closetMicroAppBodyEl) {
    scrollLeft = closetMicroAppBodyEl.scrollLeft | closetMicroAppBodyEl.scrollLeft;
    scrollTop = closetMicroAppBodyEl.scrollTop | closetMicroAppBodyEl.scrollTop;
  }
  let ulLeft = scrollLeft,
    ulTop = scrollTop;
  const { width, height } = getViewport();

  ulLeft += opts.value.placement === 'center' ? left + targetWidth / 2 - w / 2 : left;
  ulTop += top + targetHeight;

  if (ulLeft - scrollLeft < 0) {
    // 进入左侧不可见区域
    ulLeft = scrollLeft + 5;
  } else if (ulLeft + w - scrollLeft > width) {
    // 进入右侧不可见区域
    ulLeft = width + scrollLeft - w - 5;
  }
  // 进入底部不可见区域
  if (ulTop + h > height) {
    ulTop = document.documentElement.scrollTop + bottom - h - targetHeight - 12;
  }

  return `left: ${ulLeft.toFixed()}px; top: ${ulTop.toFixed()}px`;
}

/**
 * 获取视口的宽高
 * @return {*}
 */
function getViewport() {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight
  };
}

// 按钮数据初始化
function init() {
  let arr: any = [];
  props.btnData.forEach(item => {
    let newItem: any = { ...item };
    if (isFunction(item.name)) {
      newItem.name = item.name(props.scope);
    }
    if (isFunction(item.disabled)) {
      newItem.disabled = item.disabled(props.scope);
    }
    if (isFunction(item.isShow)) {
      if (item.isShow(props.scope)) arr.push(newItem);
    } else if (item.isShow !== false) {
      arr.push(newItem);
    }
    newItem = null;
  });
  if (opts.value.showNum === 0) {
    // 全局下拉展示
    data.value = [[], arr];
  } else if (arr.length > opts.value.showNum && opts.value.isHidden) {
    data.value = [arr.slice(0, opts.value.showNum), arr.slice(opts.value.showNum)];
  } else {
    data.value = [arr];
  }
  arr = null;
}

function getOptions(opts: IOption): IOption {
  const { isHidden, showNum, trigger, placement } = opts;
  return {
    isHidden: isHidden ?? defaultOptions.isHidden,
    showNum: showNum ?? defaultOptions.showNum,
    trigger: trigger ?? defaultOptions.trigger,
    placement: placement ?? defaultOptions.placement
  };
}
watch(
  () => props.option,
  newV => {
    opts.value = getOptions(newV);
  },
  { immediate: true }
);
watch(
  () => props.btnData,
  newV => {
    init();
  },
  { immediate: true }
);
// onBeforeMount(() => {
//   opts.value = getOptions(props.option);
//   init();
// });

onBeforeUnmount(() => {
  data.value = null;
  // @ts-ignore
  opts.value = null;
});
</script>
<style lang="less">
.collapse-btns-popover {
  background-color: #fff;
  list-style: none;
  margin-top: 10px;
  padding: 4px;
  min-width: 80px;
  visibility: hidden;
  border-radius: 3px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  li {
    padding: 0 10px;
    height: 32px;
    line-height: 32px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    i.collapse-btns-icon {
      font-size: 14px;
      margin-right: 10px;
    }
    &:not([disabled]):hover {
      background-color: rgb(243, 243, 245);
      cursor: pointer;
    }
    &[disabled] {
      cursor: not-allowed;
      color: rgba(51, 54, 57, 0.5);
    }
  }
}
</style>
<style lang="less" scoped>
.collapse-btns-container {
  display: flex;
  flex-flow: wrap;
  // gap: 8px 12px;
  i,
  .text-button {
    &:not(:first-child) {
      margin-left: 12px;
    }
    font-size: 14px;
    cursor: pointer;
    &[disabled] {
      cursor: not-allowed;
      color: rgba(51, 54, 57, 0.5);
    }
    &:not([disabled]):hover {
      color: var(--app-primary-color-hover);
    }
  }
}
</style>
