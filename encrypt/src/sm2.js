const { SM2 } = require('gm-crypto');

const { publicKey, privateKey } = SM2.generateKeyPair();
console.log('publicKey, privateKey', publicKey, privateKey);
const originalData = 'SM2 椭圆曲线公钥密码算法';

const encryptedData = SM2.encrypt(originalData, publicKey, {
  inputEncoding: 'utf8',
  outputEncoding: 'base64'
});
console.log('encryptedData', encryptedData);

const decryptedData = SM2.decrypt(encryptedData, privateKey, {
  inputEncoding: 'base64',
  outputEncoding: 'utf8'
});
console.log('decryptedData', decryptedData);
