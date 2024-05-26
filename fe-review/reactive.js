/*
 * @Description:
 * @Date: 2024-01-16 15:02:55
 * @LastEditors: chendq
 * @LastEditTime: 2024-01-16 15:12:11
 * @Author      : chendq
 */
const obj = { a: 1, b: 'cc', f: [1, 23] };
let newObj = { b: 'new' };
Object.defineProperty(obj, 'b', {
  get() {
    return '_get';
  },
  set(newValue) {
    newObj.b = newValue + '_seted';
  },
  enumerable: true,
  configurable: true
});

setTimeout(() => {
  console.log('get obj.b', obj.b);
  obj.b = 5;
  console.log('set obj.b', newObj);
}, 2000);
