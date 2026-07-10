declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'htmldiff-js' {
  export default class HtmlDiff {
    static execute(oldText: string, newText: string): string;
  }
}
