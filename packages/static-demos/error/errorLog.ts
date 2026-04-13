/**
 * @Description
 * @Version  1.0.0
 * @Author  hang
 * @Date  2022-12-07 14:31:33
 * @LastEditors  hang
 * @LastEditTime  2022-12-14 00:47:14
 */
import type { ErrorLogInfo } from './errorType';
import { defineStore } from 'pinia';
import { store } from './store';
import { ErrorTypeEnum } from './errorType';
import { formatDate } from 'sculp-js';

export interface ErrorLogState {
  errorLogInfoList: ErrorLogInfo[];
  errorLogListCount: number;
}

export const useErrorLogStore = defineStore({
  id: 'app-error-log',
  state: (): ErrorLogState => ({
    errorLogInfoList: [],
    errorLogListCount: 0,
  }),

  getters: {
    getErrorLogInfoList: (state): ErrorLogInfo[] => state.errorLogInfoList,
    getErrorLogListCount: (state): number => state.errorLogListCount,
  },
  actions: {
    addErrorLogInfo(info: ErrorLogInfo) {
      const item = {
        ...info,
        time: formatDate(new Date()),
      };
      this.errorLogInfoList = [item, ...(this.errorLogInfoList || [])];
      this.errorLogListCount += 1;
      if (this.errorLogListCount > 100) {
        this.errorLogInfoList.pop();
        this.errorLogListCount -= 1;
      }
    },
    setErrorLogListCount(count: number) {
      this.errorLogListCount = count;
    },
    /**
     * Triggered after ajax request error
     * @param error
     * @returns
     */
    addAjaxErrorInfo(error) {
      if (process.env.NODE_ENV === 'development') return;

      const errInfo: Partial<ErrorLogInfo> = {
        message: error.message,
        type: ErrorTypeEnum.AJAX,
      };
      if (error.response) {
        const { config: { url = '', data: params = '', method = 'get', headers = {} } = {}, data = {} } =
          error.response;
        errInfo.url = url;
        errInfo.name = 'Ajax Error!';
        errInfo.file = window.location.href;
        errInfo.stack = JSON.stringify(data);
        errInfo.detail = JSON.stringify({ params, method, headers });
        this.addErrorLogInfo(errInfo as ErrorLogInfo);
      }
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'custom-error-log', // 自定义 Key值
        storage: localStorage, // 选择存储方式
      },
    ],
  },
});

// Need to be used outside the setup
export function useErrorLogStoreWithOut() {
  return useErrorLogStore(store);
}
