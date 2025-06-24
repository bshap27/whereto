const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  ...require('ts-jest/presets').defaults,
  testEnvironment: 'jsdom',
  transform: {
    ...tsJestTransformCfg,
  },
};