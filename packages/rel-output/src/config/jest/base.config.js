const path = require('path');

process.env.TZ = 'UTC';

module.exports = {
  testEnvironment: 'jsdom',
  resolver: path.join(__dirname, 'exportMapsResolver.js'),
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      'babel-jest',
      {
        presets: ['next/babel'],
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|png)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: ['/node_modules/(?!(lodash-es|marked-extended-latex|ag-grid-react|ag-grid-community|ag-grid-enterprise)/)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  setupFiles: ['jest-canvas-mock', path.join(__dirname, 'setEnvVars.js')],
  setupFilesAfterEnv: [path.join(__dirname, 'jest.setup.js')],
};
