/*
 * @Description:
 * @Date: 2023-07-07 12:32:55
 * @LastEditors: chendq
 * @LastEditTime: 2024-04-29 14:08:53
 * @Author      : chendq
 */
// import { weAtob } from './we-decode';
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
 * Web端：等比例压缩图片批量处理 (size小于200KB，不压缩)
 * @param {File | FileList} file 文件
 * @param {ICompressOptions} options
 * @returns {Promise<object> | undefined}
 */
function compressImg(file, options) {
  console.assert(file instanceof File || file instanceof FileList, `${file} 必须是File或FileList类型`);
  console.assert(supportCanvas(), `当前环境不支持 Canvas`);
  let targetQuality = 0.52;
  if (file instanceof File) {
    const sizeKB = +parseInt((file.size / 1024).toFixed(2));
    if (sizeKB <= 1024) {
      targetQuality = 0.85;
    } else if (5 * 1024 < sizeKB) {
      targetQuality = 0.92;
    }
  }
  if (options.quality) {
    targetQuality = options.quality;
  }
  if (file instanceof FileList) {
    return Promise.all(Array.from(file).map(el => compressImg(el, { mime: options.mime, quality: targetQuality }))); // 如果是 file 数组返回 Promise 数组
  } else if (file instanceof File) {
    return new Promise(resolve => {
      const sizeKB = +parseInt((file.size / 1024).toFixed(2));
      if (+(file.size / 1024).toFixed(2) < 200) {
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
            let targetWidth = image.width;
            let targetHeight = image.height;
            const originWidth = image.width;
            const originHeight = image.height;
            if (1 * 1024 <= sizeKB && sizeKB < 10 * 1024) {
              const maxWidth = 1600,
                maxHeight = 1600;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            } else if (10 * 1024 <= sizeKB && sizeKB <= 20 * 1024) {
              const maxWidth = 1400,
                maxHeight = 1400;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            }
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            context.clearRect(0, 0, targetWidth, targetHeight);
            context.drawImage(image, 0, 0, targetWidth, targetHeight); // 绘制 canvas
            const canvasURL = canvas.toDataURL(options.mime, targetQuality);
            const buffer = globalThis.weAtob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], file.name, {
              type: options.mime
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
