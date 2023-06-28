Promise.resolve().finally();
const getVal = (timeout = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(`${timeout}ms后：promise 2`), timeout);
  });
};
(async () => {
  const re = await getVal(2000);
  console.log('测试re:', re);
})();

Promise.allSettled([getVal(), getVal(3000)]).then(res => {
  console.log('allSettled', res);
});
