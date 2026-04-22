'use strict';

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'Controllers/**/*.js',
    '!Controllers/ChannelControllers.js',
    '!Controllers/DmControllers.js',
    '!Controllers/GifControllers.js',
    'middleware/**/*.js',
    '!middleware/Error.js',
    'utils/**/*.js',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
  testMatch: ['**/__tests__/**/*.test.js'],
};
