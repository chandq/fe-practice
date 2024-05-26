# 前端复习

## 前端释义

前端作用：为用户呈现网页内容，为用户的界面操作提供交互能力

## JS 运行环境

1. 网络浏览器
2. nodejs

## 前端三板斧

HTML + JS + CSS

### HTML

class: 对元素一系列样式的定义

- JS
  Function

- css
  - 选择器
  - 盒模型
  - 布局
  - 动画： @keyframes、canvas、svg

DOM: document object model

## 技术发展史

1. web 1.0: HTML + JS + CSS 原生技术栈，主要以展示信息为主

   Yahoo、新浪和搜狐等，内容为主，少交互；

2. web 2.0: 多交互，注重前后端分离
   - jQuery 时代
     - ajax： 支持异步操作
     - jQuery： 对 DOM、 样式、事件、动画操作的简化和增强，支持链式调用方式操作 DOM
   - 后 jQuery 时代-前端模块化
     确定模块的加载顺序，模块标准的演进 AMD -> CMD -> commonjs、 ES module
   - 前端为主的 MV\*时代：angularJS、react、vue

- 请求工具
  - axios
  - fetch

CMD: commonjs, nodejs 采用， require, module.exports, exports
ES6: import 导入， export 导出

## web 标准

## 当前前端主流框架

- angularJS： Google 公司开发和维护, MVVM 模式 model-view-view-model
- react：Facebook 公司开发和维护
- vue：尤雨溪团队开发和维护

## 大前端

### web 端

- pc 端： angularJS、react、vue

### 移动端

通过 Webview (APP 原生组件，内置高性能的浏览器，能解析 DOM)

- H5:
- 小程序：uniapp
- APP：react-native
- Hybrid APP：APP + H5
  - 优势：开发效率高、兼容性好
  - 劣势：性能稍差

### 桌面端

electron： Chromium - V8

### 服务端

nodejs

- nestjs 框架

渲染方式：

- CSR: client side render
  - angularJS
  - react
  - vue
- SSR: server side render
  - react: next.js
  - vue: nuxt.js

## vue 框架

SPA: single page application, only one html page

### vue 2.x

- Object.defineProperty 实现双向绑定
- 选项式 API

两种写法：

- 单文件组件
- 非单文件组件 Vue.extend

### vue 3.x

- Proxy 实现双向绑定
- 组合式 API
- 支持 Typescript (在工具应用广泛)
