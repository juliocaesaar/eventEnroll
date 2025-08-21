module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/server'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.ts',
    '!server/index.ts',
    '!server/**/*.d.ts',
  ],
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
};