/*
 * @Description:
 * @Date: 2024-01-16 20:46:03
 * @LastEditors: chendq
 * @LastEditTime: 2024-01-16 21:33:33
 * @Author      : chendq
 */
const aa = function () {
  try {
    // import('./vue/vue3-spa-demo/mock/temp2.cjs').then(res => {
    //   console.log('res', res);
    // });
    // const yy = require('./vue/vue3-spa-demo/mock/temp.js');
    const yy2 = require('./vue/vue3-spa-demo/mock/temp2.cjs');
    console.log('ss', yy);
  } catch (error) {
    console.log('error', error, error.code);
  }
};
aa();
