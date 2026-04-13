// 1. 在 TypeScript 中设置某些可选属性为必需

interface Employee {
  id?: number;
  name: string;
  salary?: number;
}
// -?: 语法称为映射修饰符，用于影响可选性。
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

// 👇️ Make salary required
const emp1: WithRequiredProperty<Employee, 'salary'> = {
  name: 'Bobby Hadz',
  salary: 100,
};

// 👇️ Make salary and id required
const emp2: WithRequiredProperty<Employee, 'salary' | 'id'> = {
  id: 0,
  name: 'Bobby Hadz',
  salary: 100,
};

console.log('emp1,emp2::', emp1, emp2)

// 2. 使用Required 让所有属性必选
interface Employee2 {
  id?: number;
  name?: string;
  salary?: number;
}

const emp3: Required<Employee2> = {
  id: 1,
  name: 'Bobby Hadz',
  salary: 1000,
};

// 3. 使用Partial 让所有属性可选
interface Employee3 {
  id: number;
  name: string;
  salary: number;
}

const emp4: Partial<Employee3> = {
  id: 1,
};
