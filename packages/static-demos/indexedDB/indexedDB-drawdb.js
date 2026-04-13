/*
 * @Description:
 * @Date: 2025-09-07 12:34:43
 * @LastEditors: chendq
 * @LastEditTime: 2025-09-07 12:34:43
 * @Author      : chendq
 */
/*
 * @Description:
 * @Date: 2025-08-06 16:19:40
 * @LastEditors: chendq
 * @LastEditTime: 2025-09-03 17:03:03
 * @Author      : chendq
 */

class OpIndexedDB {
  constructor(dbName, dbVersion) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.db = null;
    this.objectStore = null;
  }
  openDB(table = 'diagrams') {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = event => {
        this.db = event.target.result;
        this.objectStore = this.db.createObjectStore(table, { keyPath: 'id' });
      };
      request.onsuccess = event => {
        this.db = event.target.result;
        resolve(this.db);
      };
      // 错误处理
      request.onerror = function (event) {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  queryByTable(tableName) {
    return new Promise((resolve, reject) => {
      // 查询数据
      var transaction = this.db.transaction([tableName]);
      var queryObjectStore = transaction.objectStore(tableName);
      transaction.oncomplete = function () {
        console.log('Transaction completed: data added.');
      };

      transaction.onerror = function (event) {
        console.error('Transaction failed:', event);
        reject(event.target.error);
      };

      queryObjectStore.getAll().onsuccess = event => {
        console.log(`已获取的${tableName}：`, event.target.result);
        resolve(event.target.result);
      };
    });
  }
  recoveryDataByTable(tableName, data) {
    console.log('tableName, data', tableName, data);
    return new Promise((resolve, reject) => {
      // 查询数据
      var transaction = this.db.transaction([tableName], 'readwrite');
      var objectStore = transaction.objectStore(tableName);

      // Clear existing data first
      objectStore.clear().onsuccess = () => {
        // Add all data items to the object store
        data.forEach(item => {
          objectStore.add(item);
        });
      };

      transaction.oncomplete = function () {
        console.log('Transaction completed: data added.');
        resolve();
      };

      transaction.onerror = function (event) {
        console.error('Transaction failed:', event);
        reject(event.target.error);
      };
    });
  }
}

const drawDB = new OpIndexedDB('drawDB', 60);
drawDB.openDB('diagrams').then(db => {
  console.log('db', db);
  drawDB.queryByTable('diagrams').then(data => {
    console.log('data', data);
    localStorage.setItem('drawDB', JSON.stringify(data));
  });
});

drawDB.openDB('diagrams').then(db => {
  console.log('db', db);
  drawDB.recoveryDataByTable('diagrams', JSON.parse(localStorage.getItem('drawDB'))).then(data => {
    console.log('recoveryDataByTable', true);
  });
});

// 往iframe 文档中植入代码并执行
