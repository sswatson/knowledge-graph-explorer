import '@types/jest';

declare global {
  namespace jest {
    interface Expect {
      toBeUuid(): void
    }

    interface Matchers<R> {
      toBeUuid(): R;
    }
  }
}