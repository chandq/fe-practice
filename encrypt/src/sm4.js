const { SM4, SM2 } = require('gm-crypto');

const key = '0123456789abcdeffedcba9876543210'; // Any string of 32 hexadecimal digits
const originalData = 'SM4 国标对称加密';

/**
 * Block cipher modes:
 * - ECB: electronic codebook
 * - CBC: cipher block chaining
 */

let encryptedData, decryptedData;

// ECB
encryptedData = SM4.encrypt(originalData, key, {
  inputEncoding: 'utf8',
  outputEncoding: 'base64'
});
console.log('encryptedData', encryptedData);
decryptedData = SM4.decrypt(encryptedData, key, {
  inputEncoding: 'base64',
  outputEncoding: 'utf8'
});

// CBC
const iv = '0123456789abcdeffedcba9876543210'; // Initialization vector(any string of 32 hexadecimal digits)
encryptedData = SM4.encrypt(originalData, key, {
  iv,
  mode: SM2.constants.CBC,
  inputEncoding: 'utf8',
  outputEncoding: 'hex'
});
console.log('encryptedData2', encryptedData);

decryptedData = SM4.decrypt(encryptedData, key, {
  iv,
  mode: SM2.constants.CBC,
  inputEncoding: 'hex',
  outputEncoding: 'utf8'
});
