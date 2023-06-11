/*
 * @Description: 大数据去重的性能测试
 * @Date: 2023-06-10 19:21:19
 * @LastEditors: chendq
 * @LastEditTime: 2023-06-11 19:31:04
 * @Author      : chendq
 */

/**
 * 生成指定长度且包含20%、50%、80%重复值的二维数组
 * @param {number} dataLen
 * @return {array} 长度为3的二维数组
 */
function genDataWithSpecLen(dataLen) {
  var data = [];
  // 代码就写一个1万的例子，避免篇幅过长。
  [2, 5, 8].map(item => {
    data.push(
      Array.from(new Array(dataLen), function (item2, i) {
        return i % 10 < item || Math.random();
      })
    );
    // 可在此处添加十万、百万.. 数据
  });
  return data;
}
// ******************************* 测试效率函数

/**
 * 1. 双重for循环 + splice / flag: 使用splice删除
 * @param {*} arr
 * @returns
 */
function distinctBySplice(arr) {
  // 此处为去重代码
  for (var i = 0, len = arr.length; i < len; i++) {
    for (var i2 = i + 1; i2 < len; i2++) {
      if (arr[i] === arr[i2]) {
        arr.splice(i2, 1); // 删除重复的数据
        i2--; // 删除数据后index需要前移一位
        len = arr.length; // 删除数据后重新获取数组长度
      }
    }
  }
  return arr;
}
/**
 * 1. 双重for循环 + splice / flag: 使用flag标记
 * @param {*} arr
 * @returns
 */
function distinctByFlag(arr) {
  // 此处为去重代码
  var newArr = [];
  for (var i = 0, len = arr.length; i < len; i++) {
    var flag = true;
    for (var i2 = 0; i2 < newArr.length; i2++) {
      if (arr[i] === newArr[i2]) {
        flag = false;
        break;
      }
    }
    flag && newArr.push(arr[i]);
  }
  return newArr;
}
/**
 * 2. for 循环加 indexOf / includes
 * @param {*} arr
 * @returns
 */
function distinctByIndexOf(arr) {
  var newArray = [];
  for (let i = 0, len = arr.length; i < len; i++) {
    newArray.indexOf(arr[i]) === -1 && newArray.push(arr[i]);
    // !newArray.includes(arr[i]) && newArray.push(arr[i])
  }
  return newArray;
}
/**
 * 3. filter 加 indexOf
 * @param {*} arr
 * @returns
 */
function distinctByFilter(arr) {
  return arr.filter((item, i) => {
    return arr.indexOf(item) === i;
  });
}
/**
 * 4. 使用sort排序后去重
 * @param {*} arr
 * @returns
 */
function distinctBySort(arr) {
  arr.sort((a, b) => a - b);
  var arrry = [arr[0]];
  for (var i = 1, len = arr.length; i < len; i++) {
    if (arr[i] !== arr[i - 1]) {
      arrry.push(arr[i]);
    }
  }
  return arrry;
}
/**
 * 5. sort 加 reduce
 * @param {*} arr
 * @returns
 */
function distinctBySortReduce(arr) {
  arr.sort((a, b) => a - b);
  return arr.reduce(
    (newArr, current) => {
      if (newArr[newArr.length - 1] !== current) {
        newArr.push(current);
      }
      return newArr;
    },
    [arr[0]]
  );
}

/**
 * 6. 利用对象key唯一(hasOwnProperty)
 * @param {*} arr
 * @returns
 */
function distinctByHasOwnProperty(arr) {
  var newArrry = [];
  var obj = {};
  for (var i = 0, len = arr.length; i < len; i++) {
    if (obj[arr[i]] !== 1) {
      // obj.hasOwnProperty(arr[i]) 也可以
      newArrry.push(arr[i]);
      obj[arr[i]] = 1;
    }
  }
  return newArrry;
}
/**
 * 7. 使用Map数据结构
 * @param {*} arr
 * @returns
 */
function distinctByMap(arr) {
  const newArray = [];
  const newMap = new Map();
  for (let i = 0, len = arr.length; i < len; i++) {
    if (!newMap.get(arr[i])) {
      // newMap.has(arr[i])
      newMap.set(arr[i], 1);
      newArray.push(arr[i]);
    }
  }
  return newArray;
}
/**
 * 8. 使用Set (仅限相同类型的简单数据)
 * @param {*} arr
 * @returns
 */
function distinctBySet(arr) {
  return [...new Set(arr)];
}
/**
 * 9. 使用Map的Key唯一值
 * @param {*} arr
 * @returns
 */
function distinctByMapKey(arr) {
  const newMap = new Map();
  for (let i = 0, len = arr.length; i < len; i++) {
    if (!newMap.has(arr[i])) {
      // newMap.has(arr[i])
      newMap.set(arr[i], arr[i]);
    }
  }
  return Array.from(newMap.values());
}
function distinctTest(distinctFunc, repeatData, distinctTypeDesc) {
  repeatData.forEach(item => {
    console.group();
    var length = item.length;
    console.log(`数据长度：%c${item.length.toLocaleString()}`, 'color: green');
    console.time('耗时');
    const startTime = Date.now();
    var newArr = distinctFunc(item);
    const endTime = Date.now();
    console.timeEnd('耗时');
    console.log('耗时计算：', endTime - startTime);
    console.log(`数据重复量：%c${(length - newArr.length).toLocaleString()}`, 'color: blue');
    console.log('————————————————————————————————————————————');
    console.groupEnd();
  });
}
function distinctBySpec(distinctBySpecFunc, distinctTypeDesc) {
  console.group(distinctTypeDesc);
  distinctTest(distinctBySpecFunc, genDataWithSpecLen(10 ** 4), distinctTypeDesc);
  distinctTest(distinctBySpecFunc, genDataWithSpecLen(10 ** 5), distinctTypeDesc);
  distinctTest(distinctBySpecFunc, genDataWithSpecLen(10 ** 6), distinctTypeDesc);
  distinctTest(distinctBySpecFunc, genDataWithSpecLen(10 ** 7), distinctTypeDesc);
  console.groupEnd(distinctTypeDesc);
}
function distinctMain() {
  // distinctBySpec(distinctBySplice, '1. 双重for循环 + splice / flag: 使用splice删除');
  // distinctBySpec(distinctByFlag, '1. 双重for循环 + splice / flag: 使用flag标记');
  // distinctBySpec(distinctByIndexOf, '2. for 循环加 indexOf / includes');
  distinctBySpec(distinctByFilter, '3. filter 加 indexOf');
  // distinctBySpec(distinctBySort, '4. 使用sort排序后去重');
  // distinctBySpec(distinctBySortReduce, '5. sort 加 reduce');
  // distinctBySpec(distinctByHasOwnProperty, '6. 利用对象key唯一(hasOwnProperty)');
  // distinctBySpec(distinctByMap, '7. 使用Map数据结构');
  // distinctBySpec(distinctBySet, '8. 使用Set (仅限相同类型的简单数据)');
  // distinctBySpec(distinctByMapKey, '9. 使用Map的Key唯一值');
}
/**
 * 获取按指定去重方法测试去重后的测试结果（仅包含指定重复率的测试结果）
 * @param {*} distinctFunc 去重函数
 * @param {*} repeatData 包含重复数据的长度为3的二维数组
 * @param {*} timeLen 去重测试的耗时方法说明
 * @return {*}
 */
function distinctTestWithFormat(distinctFunc, repeatData, timeLen) {
  return repeatData.map(item => {
    const testResult = {};
    var length = item.length;
    testResult['数据长度'] = item.length.toLocaleString();
    const startTime = Date.now();
    var newArr = distinctFunc(item);
    const endTime = Date.now();
    testResult['数据重复量'] = (length - newArr.length).toLocaleString();
    // testResult[timeLen ?? '耗时(ms)'] = (endTime - startTime).toLocaleString();
    testResult.time = {
      label: timeLen ?? '耗时(ms)',
      value: (endTime - startTime).toLocaleString()
    };
    return testResult;
  });
}
// function distinctBySpecWithFormat(distinctBySpecFunc, distinctTypeDesc) {
//   console.group(distinctTypeDesc);
//   console.table(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 4), distinctTypeDesc));
//   console.table(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 5), distinctTypeDesc));
//   console.table(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 6), distinctTypeDesc));
//   console.table(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 7), distinctTypeDesc));

//   console.groupEnd(distinctTypeDesc);
// }
const DistinctWithFormatReturn = [
  {
    指标项: '1w 20%重复',
    数据重复量: '1,999',
    '1. 双重for循环 + splice / flag: 使用splice删除': '152',
    time: {
      label: '1. 双重for循环 + splice / flag: 使用splice删除',
      value: '152'
    }
  },
  {
    指标项: '1w 50%重复',
    数据重复量: '4,999',
    '1. 双重for循环 + splice / flag: 使用splice删除': '39',
    time: {
      label: '1. 双重for循环 + splice / flag: 使用splice删除',
      value: '39'
    }
  },
  {
    指标项: '1w 80%重复',
    数据重复量: '7,999',
    '1. 双重for循环 + splice / flag: 使用splice删除': '9',
    time: {
      label: '1. 双重for循环 + splice / flag: 使用splice删除',
      value: '9'
    }
  },
  {
    指标项: '10w 20%重复',
    数据重复量: '19,999',
    '1. 双重for循环 + splice / flag: 使用splice删除': '9,949',
    time: {
      label: '1. 双重for循环 + splice / flag: 使用splice删除',
      value: '9,949'
    }
  }
];
/**
 * 获取按指定去重方法测试去重后的测试结果（覆盖20%、50%、80%重复率）
 * @param {*} distinctBySpecFunc 去重函数
 * @param {*} distinctTypeDesc  去重方法说明
 * @param {*} dataLen 去重的最大数据量，默认：10w -> 5, 可选: 100w -> 6 | 1000w -> 7
 * @return {DistinctWithFormatReturn}
 */
function distinctBySpecWithFormatReturn(distinctBySpecFunc, distinctTypeDesc, dataLen = 5) {
  const resArr = [
    distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 4), distinctTypeDesc),
    distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 5), distinctTypeDesc)
  ];
  if (dataLen >= 6) {
    resArr.push(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 6), distinctTypeDesc));
  }
  if (dataLen >= 7) {
    resArr.push(distinctTestWithFormat(distinctBySpecFunc, genDataWithSpecLen(10 ** 7), distinctTypeDesc));
  }
  const allPerfLabel = [
    ['1w 20%重复', '1w 50%重复', '1w 80%重复'],
    ['10w 20%重复', '10w 50%重复', '10w 80%重复'],
    ['100w 20%重复', '100w 50%重复', '100w 80%重复'],
    ['1000w 20%重复', '1000w 50%重复', '1000w 80%重复']
  ];
  return new Array(resArr.length * 3).fill('').map((el, index) => {
    const [i, j] = [Math.floor(index / 3), index % 3];
    el = { ['指标项']: allPerfLabel?.[i]?.[j] };
    const resItem = resArr[i][j];
    if (resItem) {
      el['数据重复量'] = resItem['数据重复量'];
      el[resItem.time.label] = resItem.time.value;
      el.time = {
        label: resItem.time.label,
        value: resItem.time.value
      };
    }
    // console.log('el', el);
    return el;
  });
  // testRes[0] = {
  //   ['指标项']: perfLabel[0],
  //   ['数据重复量']: resArr[0][0]['数据重复量'],
  //   [resArr[0][0].time.label]: resArr[0][0].time.value
  // };
  // testRes[1] = {
  //   ['指标项']: perfLabel[1],
  //   ['数据重复量']: resArr[0][1]['数据重复量'],
  //   [resArr[0][0].time.label]: resArr[0][1].time.value
  // };
  // testRes[2] = {
  //   ['指标项']: perfLabel[2],
  //   ['数据重复量']: resArr[0][2]['数据重复量'],
  //   [resArr[0][0].time.label]: resArr[0][2].time.value
  // };
  // testRes[3] = {
  //   ['指标项']: perfLabel[2],
  //   ['数据重复量']: resArr[1][2]['数据重复量'],
  //   [resArr[0][0].time.label]: resArr[0][2].time.value
  // };
  // return testRes;
}
function distinctMainWithFormat() {
  console.time('测试完成耗时');
  const allTestRes = [
    distinctBySpecWithFormatReturn(distinctBySplice, '1. 双重for循环 + splice / flag: 使用splice删除'),
    distinctBySpecWithFormatReturn(distinctByFlag, '1. 双重for循环 + splice / flag: 使用flag标记'),
    distinctBySpecWithFormatReturn(distinctByIndexOf, '2. for 循环加 indexOf / includes'),
    distinctBySpecWithFormatReturn(distinctByFilter, '3. filter 加 indexOf'),
    distinctBySpecWithFormatReturn(distinctBySort, '4. 使用sort排序后去重', 7),
    distinctBySpecWithFormatReturn(distinctBySortReduce, '5. sort 加 reduce', 7),
    distinctBySpecWithFormatReturn(distinctByHasOwnProperty, '6. 利用对象key唯一(hasOwnProperty)', 7),
    distinctBySpecWithFormatReturn(distinctByMap, '7. 使用Map数据结构', 7),
    distinctBySpecWithFormatReturn(distinctBySet, '8. 使用Set', 7),
    distinctBySpecWithFormatReturn(distinctByMapKey, '9. 使用Map的Key唯一值', 7)
  ];
  const allPerfLabel = [
    ['1w 20%重复', '1w 50%重复', '1w 80%重复'],
    ['10w 20%重复', '10w 50%重复', '10w 80%重复'],
    ['100w 20%重复', '100w 50%重复', '100w 80%重复'],
    ['1000w 20%重复', '1000w 50%重复', '1000w 80%重复']
  ];
  const allTestReport = new Array(4 * 3).fill('').map((el, index) => {
    const [i, j] = [Math.floor(index / 3), index % 3];
    el = { ['指标项']: allPerfLabel?.[i]?.[j] };
    allTestRes.forEach((item, k) => {
      const resItem = item[index];
      try {
        if (resItem) {
          el['数据重复量'] = resItem['数据重复量'];
          el[resItem.time.label] = resItem.time.value;
        }
      } catch (error) {
        console.log('error', error);
        debugger;
      }
    });
    console.log('el', el);
    return el;
  });
  console.timeEnd('测试完成耗时');
  console.table(allTestReport);
}
/**
 * 计算耗时的公共函数
 * @param {*} timingType
 * @param {*} cb 计算耗时的实际方法体
 * @return {*}
 */
function useTiming(timingType, cb) {
  console.time(timingType);
  cb();
  console.timeEnd(timingType);
  console.log('————————————————————————————————————————————');
}
// 循环效率计时
function LoopTestMain() {
  var array = Array.from(new Array(10000000)),
    len = array.length; // 创建1千万条数据的数组

  useTiming('for耗时', () => {
    for (let i = 0; i < len; i++) {
      // 循环体
    }
  });

  useTiming('while耗时', () => {
    let i = 0;
    while (i < len) {
      i++;
    }
  });
  useTiming('for of耗时', () => {
    for (const iterator of array) {
    }
  });
  useTiming('forEach耗时', () => {
    array.forEach(element => {});
  });
  useTiming('filter耗时', () => {
    array.filter(element => {});
  });
  useTiming('reduce耗时', () => {
    array.reduce(element => {});
  });
  useTiming('map耗时', () => {
    array.map(element => {});
  });
  useTiming('for in耗时', () => {
    for (const key in array) {
    }
  });
}
// 去重效率测试
distinctMain();
// distinctMainWithFormat();
// 循环效率测试
// LoopTestMain();
