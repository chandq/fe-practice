/*
 * @Description:
 * @Date: 2024-01-15 16:06:29
 * @LastEditors: chendq
 * @LastEditTime: 2024-01-15 18:00:51
 * @Author      : chendq
 */
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOMContentLoaded');
  document.querySelector('#click').addEventListener('click', click);
});

window.onload = function () {
  console.log('onload');
  // document.querySelector('#click').addEventListener('click', click);
};
function click() {
  console.log('sss', document.querySelector('#content'));

  // document.querySelector('#content').innerText = '欢迎来到 前端 领域';
  document.querySelector('#content').innerHTML = '<span>prefix</span> <span1></span1> 欢迎来到 前端 领域';
}
