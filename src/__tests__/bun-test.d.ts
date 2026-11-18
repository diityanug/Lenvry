declare module 'bun:test' {
  type HookFn = () => void | Promise<void>;

  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: HookFn): void;
  export function afterEach(fn: HookFn): void;
  export function beforeAll(fn: HookFn): void;
  export function afterAll(fn: HookFn): void;

  export interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: unknown): void;
    toHaveLength(expected: number): void;
    toContain(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
  }

  export function expect<T>(actual: T): Matchers<T>;

  export const mock: {
    module(specifier: string, factory: () => Record<string, unknown>): void;
  };
}
