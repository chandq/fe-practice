/*
 * @Description:
 * @Date: 2023-07-07 12:32:55
 * @LastEditors: chendq
 * @LastEditTime: 2023-07-07 13:55:43
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
 * 压缩图片方法 (size小于200KB，不压缩)
 * @param {file} file 文件
 * @param {Number} quality 图片质量(取值0-1之间默认0.92)
 */
export function compressImg(file, quality) {
  var qualitys = 0.52;
  if (file.size) {
    console.log(parseInt((file.size / 1024).toFixed(2)));
    if (parseInt((file.size / 1024).toFixed(2)) < 1024) {
      qualitys = 0.85;
    }
    if (5 * 1024 < parseInt((file.size / 1024).toFixed(2))) {
      qualitys = 0.92;
    }
  }
  if (quality) {
    qualitys = quality;
  }
  if (file[0]) {
    return Promise.all(Array.from(file).map(e => compressImg(e, qualitys))); // 如果是 file 数组返回 Promise 数组
  } else {
    return new Promise(resolve => {
      console.log(file);
      if ((file.size / 1024).toFixed(2) < 200) {
        resolve({
          file: file
        });
      } else {
        const reader = new FileReader(); // 创建 FileReader
        reader.onload = ({ target: { result: src } }) => {
          const image = new Image(); // 创建 img 元素
          image.onload = async () => {
            const canvas = document.createElement('canvas'); // 创建 canvas 元素
            const context = canvas.getContext('2d');
            var targetWidth = image.width;
            var targetHeight = image.height;
            var originWidth = image.width;
            var originHeight = image.height;
            if (
              1 * 1024 <= parseInt((file.size / 1024).toFixed(2)) &&
              parseInt((file.size / 1024).toFixed(2)) <= 10 * 1024
            ) {
              var maxWidth = 1600;
              var maxHeight = 1600;
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
            if (
              10 * 1024 <= parseInt((file.size / 1024).toFixed(2)) &&
              parseInt((file.size / 1024).toFixed(2)) <= 20 * 1024
            ) {
              maxWidth = 1400;
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
            const canvasURL = canvas.toDataURL('image/jpeg', qualitys);
            const buffer = globalThis.weAtob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], file.name, {
              type: 'image/jpeg'
            });
            console.log({
              file: miniFile,
              bufferArray,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2)),
              qualitys: qualitys
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
