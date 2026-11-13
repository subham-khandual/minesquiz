/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@mines-quiz/types$': '<rootDir>/../../packages/types/src',
    '^@mines-quiz/utils$': '<rootDir>/../../packages/utils/src',
  },
};

