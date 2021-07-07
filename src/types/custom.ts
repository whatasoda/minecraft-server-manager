declare global {
  // https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type#answer-50375286
  type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

  type KeyValueUnion<T> = {
    [K in keyof T]-?: { key: K; value: T[K] };
  }[keyof T];
}
export {};
