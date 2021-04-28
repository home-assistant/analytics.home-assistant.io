export const MockedKV = () => ({
  put: jest.fn(async () => {}),
  get: jest.fn(async () => {}),
  list: jest.fn(async () => {}),
  getWithMetadata: jest.fn(async () => {}),
});

export const MockedSentry = () => ({
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
});
