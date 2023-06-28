/*
 * @Description:
 * @Date: 2023-06-28 14:13:10
 * @LastEditors: chendq
 * @LastEditTime: 2023-06-28 14:19:48
 * @Author      : chendq
 */
const fn = () => 1;
const nullOpe = arg => {
  return arg ?? 5;
};
const optChain = arg => {
  return arg?.a?.b ?? 2;
};
console.log('test:default-passArgs', nullOpe(), nullOpe(2));
