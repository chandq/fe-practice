/*
 * @Description:
 * @Date: 2023-07-07 12:32:55
 * @LastEditors: chendq
 * @LastEditTime: 2025-06-02 12:56:15
 * @Author      : chendq
 */
// import { weAtob } from './we-decode';

function typeIs(any) {
  return Object.prototype.toString.call(any).slice(8, -1);
}
// 基本数据类型判断
const isString = any => typeof any === 'string';
const isBoolean = any => typeof any === 'boolean';
const isSymbol = any => typeof any === 'symbol';
const isBigInt = any => typeof any === 'bigint';
const isNumber = any => typeof any === 'number' && !Number.isNaN(any);
const isUndefined = any => typeof any === 'undefined';
const isNull = any => any === null;
const isPrimitive = any => any === null || typeof any !== 'object';
function isNullOrUnDef(val) {
  return isUndefined(val) || isNull(val);
}
// 复合数据类型判断
const isObject = any => typeIs(any) === 'Object';
const isArray = any => Array.isArray(any);
/**
 * @description: 按链接下载函数
 * @param {string} fileName
 * @param {string} href
 * @return {*}
 */
export function downloadFileByLink(fileName, href) {
  const link = document.createElement('a');
  const tmpEle = document.body.appendChild(link);
  link.download = fileName;
  link.href = href;
  link.click();
  tmpEle.remove();
}
/**
 * @description: 流下载函数
 * @param {string} method
 * @param {string} url
 * @param {string} data
 * @param {*} fileName
 * @return {*}
 */
export function downloadByStream({ method = 'GET', url, data = {}, fileName = '文件.xlsx' }) {
  const req = new XMLHttpRequest();
  req.open(method, url, true);
  req.responseType = 'blob';
  req.setRequestHeader('Content-Type', 'application/json');
  req.onload = function () {
    const data = req.response;
    const blob = new Blob([data]);
    const blobUrl = window.URL.createObjectURL(blob);
    download(blobUrl, fileName);
  };
  req.send(JSON.stringify(data));
}

export function download(blobUrl, fileName) {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = blobUrl;
  a.click();
}
/**
 * 判断是否支持canvas
 * @returns {boolean}
 */
function supportCanvas() {
  return !!document.createElement('canvas').getContext;
}
/**
 * 计算图片压缩后的尺寸
 *
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} originWidth
 * @param {number} originHeight
 * @returns {*}
 */
function calculateSize({ maxWidth, maxHeight, originWidth, originHeight }) {
  let width = originWidth,
    height = originHeight;
  // 图片尺寸超过限制
  if (originWidth > maxWidth || originHeight > maxHeight) {
    if (originWidth / originHeight > maxWidth / maxHeight) {
      // 更宽，按照宽度限定尺寸
      width = maxWidth;
      height = Math.round(maxWidth * (originHeight / originWidth));
    } else {
      height = maxHeight;
      width = Math.round(maxHeight * (originWidth / originHeight));
    }
  }
  return { width, height };
}
/**
 * 根据原始图片的不同尺寸计算等比例缩放后的宽高尺寸
 *
 * @param {number} sizeKB Image volume size, unit KB
 * @param {number} maxSize Image max size
 * @param {number} originWidth Image original width, unit px
 * @param {number} originHeight Image original height, unit px
 * @returns {*} {width, height}
 */
function scalingByAspectRatio({ sizeKB, maxSize, originWidth, originHeight }) {
  let targetWidth = originWidth,
    targetHeight = originHeight;
  if (isNumber(maxSize)) {
    const { width, height } = calculateSize({ maxWidth: maxSize, maxHeight: maxSize, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (sizeKB < 500) {
    // [50KB, 500KB)
    const maxWidth = 1200,
      maxHeight = 1200;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (sizeKB < 5 * 1024) {
    // [500KB, 5MB)
    const maxWidth = 1400,
      maxHeight = 1400;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (sizeKB < 10 * 1024) {
    // [5MB, 10MB)
    const maxWidth = 1600,
      maxHeight = 1600;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (10 * 1024 <= sizeKB) {
    // [10MB, Infinity)
    const maxWidth = originWidth > 15000 ? 8192 : originWidth > 10000 ? 4096 : 2048,
      maxHeight = originHeight > 15000 ? 8192 : originHeight > 10000 ? 4096 : 2048;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  }
  return { width: targetWidth, height: targetHeight };
}
/**
 * Web端：等比例压缩图片批量处理 (size小于50KB，不压缩), 支持压缩全景图或长截图
 *
 *        1. 默认根据图片原始size及宽高适当地调整quality、width、height
 *        2. 可指定压缩的图片质量 quality（若不指定则根据原始图片大小来计算）, 来适当调整width、height
 *        3. 可指定压缩的图片最大宽高 maxSize（若不指定则根据原始图片宽高来计算）, 满足大屏幕图片展示的场景
 *
 * @param {File | FileList} file 图片或图片数组
 * @param {ICompressOptions} options 压缩图片配置项，default: {mime:'image/jpeg'}
 * @returns {Promise<object> | undefined}
 */
function compressImg(file, options = { mime: 'image/jpeg' }) {
  if (!(file instanceof File || file instanceof FileList)) {
    throw new Error(`${file} require be File or FileList`);
  } else if (!supportCanvas()) {
    throw new Error(`Current runtime environment not support Canvas`);
  }
  const { quality, mime = 'image/jpeg', maxSize: size } = isObject(options) ? options : {};
  let targetQuality = quality,
    maxSize;
  if (quality) {
    targetQuality = quality;
  } else if (file instanceof File) {
    const sizeKB = +parseInt((file.size / 1024).toFixed(2));
    if (sizeKB < 1 * 50) {
      targetQuality = 1;
    } else if (sizeKB < 1 * 1024) {
      targetQuality = 0.85;
    } else if (sizeKB < 5 * 1024) {
      targetQuality = 0.8;
    } else {
      targetQuality = 0.75;
    }
  }
  if (isNumber(size)) {
    maxSize = size >= 1200 ? size : 1200;
  }
  if (file instanceof FileList) {
    return Promise.all(Array.from(file).map(el => compressImg(el, { maxSize, mime: mime, quality: targetQuality }))); // 如果是 file 数组返回 Promise 数组
  } else if (file instanceof File) {
    return new Promise(resolve => {
      const ext = {
        'image/webp': 'webp',
        'image/jpeg': 'jpg',
        'image/png': 'png'
      };
      const fileName = [...file.name.split('.').slice(0, -1), ext[mime]].join('.');
      const sizeKB = +parseInt((file.size / 1024).toFixed(2));
      if (sizeKB < 50) {
        resolve({
          file: file
        });
      } else {
        const reader = new FileReader(); // 创建 FileReader
        // @ts-ignore
        reader.onload = ({ target: { result: src } }) => {
          const image = new Image(); // 创建 img 元素
          image.onload = () => {
            const canvas = document.createElement('canvas'); // 创建 canvas 元素
            const context = canvas.getContext('2d');
            const originWidth = image.width;
            const originHeight = image.height;
            const { width, height } = scalingByAspectRatio({ sizeKB, maxSize, originWidth, originHeight });
            canvas.width = width;
            canvas.height = height;
            context.clearRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height); // 绘制 canvas
            const canvasURL = canvas.toDataURL(mime, targetQuality);
            const buffer = atob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], fileName, {
              type: mime
            });
            resolve({
              file: miniFile,
              bufferArray,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2))
            });
          };
          image.src = src;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

export { compressImg, supportCanvas };
