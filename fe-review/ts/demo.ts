// interface 声明合并
interface User {
  name: string;
}
interface User {
  age: number;
}
const user: User = { name: 'Alice', age: 25 }; // 合并成功

// type 不支持合并
type UserType = { name: string; };
type UserType = { age: number; }; // 报错：重复定义

// type 定义联合类型
type Status = 'success' | 'failure' | 'pending';

// interface 不支持
interface Status1 {
  // 报错：接口不支持联合类型
  value: 'success' | 'failure' | 'pending';
}
const ss: Status1 = { value: 'failure' }
type AnimalType = { name: string; };
