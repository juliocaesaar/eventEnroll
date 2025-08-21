// Test setup file
import { beforeAll, afterAll, afterEach } from '@jest/globals';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/eventflow_test';
process.env.SESSION_SECRET = 'test-secret-key-for-testing';
process.env.ASAAS_API_KEY = 'test-asaas-key';
process.env.ASAAS_SANDBOX = 'true';

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

beforeAll(async () => {
  // Global test setup
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Global test cleanup
});