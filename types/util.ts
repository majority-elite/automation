export type LookUpWithNestedKey<
  U,
  Key extends string | number | symbol,
  NestedKey extends string | number | symbol,
  NestedValue,
> = U extends { [key in Key]: infer S }
  ? S extends { [nestedKey in NestedKey]: NestedValue }
    ? U
    : never
  : never;
