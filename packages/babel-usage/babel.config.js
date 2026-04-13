module.exports = {
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
  ]
};
