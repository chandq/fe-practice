/**
 * @Description 数据状态管理
 * @Version  1.0.0
 * @Author  hang
 * @Date  2022-12-07 14:31:33
 * @LastEditors  hang
 * @LastEditTime  2022-12-16 22:01:22
 */
import type { App } from 'vue';
import { createPinia } from 'pinia';
// 使用持久化插件
import piniaPluginPersist from 'pinia-plugin-persist';

const store = createPinia();

store.use(piniaPluginPersist);

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };
