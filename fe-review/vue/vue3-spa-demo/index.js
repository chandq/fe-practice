/*
 * @Description:
 * @Date: 2025-12-24 17:33:17
 * @LastEditors: chendq
 * @LastEditTime: 2025-12-29 09:23:58
 * @Author      : chendq
 */
/**
 * 读取远程文件内容
 * @param {string} url - 文件 URL
 * @returns {Promise<string>} - 文件内容字符串
 */
async function readRemoteFile(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.text()
  } catch (error) {
    throw new Error(`Failed to read remote file: ${error.message}`)
  }
}
;(async () => {
  const aStr = await readRemoteFile('/codeMerge/a.html.txt')
  const bStr = await readRemoteFile('/codeMerge/b.html')
  window.aStr = aStr
  window.bStr = bStr
  // console.log('****', aStr, bStr)
})()
