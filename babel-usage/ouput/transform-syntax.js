"use strict";

/*
 * @Description:
 * @Date: 2023-06-28 14:13:10
 * @LastEditors: chendq
 * @LastEditTime: 2023-06-28 14:19:48
 * @Author      : chendq
 */
const fn = () => 1;
const nullOpe = arg => {
  return arg !== null && arg !== void 0 ? arg : 5;
};
const optChain = arg => {
  var _arg$a$b, _arg$a;
  return (_arg$a$b = arg === null || arg === void 0 ? void 0 : (_arg$a = arg.a) === null || _arg$a === void 0 ? void 0 : _arg$a.b) !== null && _arg$a$b !== void 0 ? _arg$a$b : 2;
};