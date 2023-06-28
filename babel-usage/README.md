# [babel](https://babeljs.io/docs/usage) 练习

es6+ 高级语法转译，以便兼容低版本浏览器(tsconfig 中的 target 配置也能实现转译成目标 js 的代码). 详情请访问 babel 官网.

babel 大致做了两件事情，参考 [babel 和 tsc 的使用指南](https://juejin.cn/post/7107870117878300680)

- 新 API: 使用 ES5 实现新的 API ，这种实现方式也叫作 polyfill。
- 新语法规则：使用 babel 中各种插件（plugin）实现。

babel 相关依赖：

- 核心库 `@babel/core`
- 高级语法预设 `@babel/preset-env`
- 检测、编译最新语法、api 的 js 代码 `babel-loader`
- 命令行工具 `@babel/cli`

## 指定语法插件转译

### 箭头函数转译

```bash
npm install --save-dev @babel/plugin-transform-arrow-functions
./node_modules/.bin/babel src --out-dir lib --plugins=@babel/plugin-transform-arrow-functions # ./node_modules/.bin/babel 等同 npx babel
```

### 可选链和空置转译

```bash
npm install --save-dev @babel/plugin-proposal-optional-chaining @babel/plugin-proposal-nullish-coalescing-operator
npx babel src --out-dir lib --plugins=@babel/plugin-proposal-optional-chaining --plugins=@babel/plugin-proposal-nullish-coalescing-operator
```

## 使用 presets 预设代替插件配置

使用`babel.config.js`或 `.babelrc` 来配置

示例如下：

```js
{
  presets: [
    [
      '@babel/preset-env',
      {
        // 支持的浏览器版本推荐使用 .browserslistrc 配置，可通过npx browserslist检测
        // targets: {
        //   edge: '17',
        //   firefox: '60',
        //   chrome: '67',
        //   safari: '11.1'
        // },
        useBuiltIns: 'usage',
        corejs: '3',
        modules: false,
        debug: false
      }
      // '@babel/preset-typescript', //转换ts https://babeljs.io/docs/babel-preset-typescript
      // '@babel/preset-react' //转换 react jsx https://babeljs.io/docs/babel-preset-react
    ]
  ],
  "plugins": [
    "@babel/plugin-transform-runtime",

    "@babel/plugin-proposal-function-bind",

    "@babel/plugin-proposal-export-default-from",
    "@babel/plugin-proposal-logical-assignment-operators",
    ["@babel/plugin-proposal-optional-chaining", { "loose": false }],
    ["@babel/plugin-proposal-pipeline-operator", { "proposal": "minimal" }],
    ["@babel/plugin-proposal-nullish-coalescing-operator", { "loose": false }],
    "@babel/plugin-proposal-do-expressions",

    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-proposal-function-sent",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-numeric-separator",
    "@babel/plugin-proposal-throw-expressions",

    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    ["@babel/plugin-proposal-class-properties", { "loose": true }],
    "@babel/plugin-proposal-json-strings"
  ],
}
```

## 配置兼容的浏览器版本

[browserslist GitHub](https://github.com/browserslist/browserslist)

使用`.browserslistrc`来配置, 可通过命令 `npx browserslist` 检测

```js
chrome >= 70
edge >= 79
firefox >= 69
safari >= 13.1
> 1%
```

## vite 配置兼容低版本浏览器

```js
import legacy from '@vitejs/plugin-legacy';
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      legacy({
        targets: ['chrome 70', 'not IE 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        polyfills: ['es.promise.all-settled', 'es.object.entries', 'es.object.from-entries'],
        modernPolyfills: ['es.promise.all-settled', 'es.object.entries', 'es.object.from-entries']
      })
    ],
    build: {
      target: 'es2015',
      cssTarget: 'chrome70'
    }
  };
});
```

## Q&A

1. `globalThis is not defined`

兼容低版本浏览器方案, 在 html 中添加如下代码：

```js
<script>this.globalThis || (this.globalThis = this);</script>
```

## 参考资料

[TypeScript With Babel: A Beautiful Marriage](https://iamturns.com/typescript-babel/)
