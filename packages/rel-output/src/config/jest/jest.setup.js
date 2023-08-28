import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util'

import { afterAll, beforeAll } from '@jest/globals';
import {
  installMockStorage,
  intersectionObserver,
  sessionStorage,
  localStorage
} from '@shopify/jest-dom-mocks';
import preloadAll from 'jest-next-dynamic';
import { LicenseManager as AgGridLicenseManager } from 'ag-grid-enterprise';

const CONSOLE_FAIL_TYPES = ['error', 'warn', 'assert', 'debug', 'info', 'group', 'groupCollapsed', 'groupEnd']
const originalConsoleMethods = {};

// Patch console outputs to track if they were called
CONSOLE_FAIL_TYPES.forEach(type => {
  originalConsoleMethods[type] = console[type];
  console[type] = (...args) => {
    originalConsoleMethods[type](...args);
    throw new Error(`Console.${type} was called during the test\n\n${args}`);
  };
});

// suppressing AGGrid's license console.error's
AgGridLicenseManager.prototype['validateLicense'] = jest.fn();
AgGridLicenseManager.prototype['isDisplayWatermark'] = () => false;

installMockStorage();

window.TextEncoder = TextEncoder
window.TextDecoder = TextDecoder

// Workaround for a missing definition.
// https://github.com/jsdom/jsdom/issues/3002
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = jest.fn();

  range.getClientRects = () => {
    return {
      item: () => {},
      length: 0,
      [Symbol.iterator]: jest.fn(),
    };
  };

  return range;
};

// for overlayscrollbars
const { getComputedStyle } = window;
window.getComputedStyle = elt => getComputedStyle(elt);
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// preloads components wrapped into next/dynamic
beforeAll(async () => {
  await preloadAll();
});

beforeAll(() => {
  // For @headlessui/react components
  intersectionObserver.mock();
  
  // It is necessary to mock ResizeObserver in jsdom
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  intersectionObserver.restore();
  
  // Restore the original console outputs
  CONSOLE_FAIL_TYPES.forEach(type => {
    console[type] = originalConsoleMethods[type];
  });
});

const UUID_REGEX = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;

expect.extend({
  toBeUuid(received) {
    const pass = UUID_REGEX.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be uuid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be uuid`,
        pass: false,
      };
    }
  },
});

beforeEach(() => {
  // for graphviz
  global.URL.createObjectURL = jest.fn();
});

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});


// for graphviz with enabled zoom
if (!('transform' in window.SVGElement.prototype)) {
  Object.defineProperty(window.SVGElement.prototype, 'transform', {
      get: function() {
          if (this.getAttribute('transform')) {
              const translate = this.getAttribute('transform').replace(/.*translate\((-*[\d.]+[ ,]+-*[\d.]+)\).*/, function(match, xy) {
                  return xy;
              }).split(/[ ,]+/).map(function(v) {
                  return +v;
              });
              const scale = this.getAttribute('transform').replace(/.*.*scale\((-*[\d.]+[ ,]*-*[\d.]*)\).*/, function(match, scale) {
                  return scale;
              }).split(/[ ,]+/).map(function(v) {
                  return +v;
              });
              return {
                  baseVal: {
                      numberOfItems: 1,
                      consolidate: function() {
                          return {
                              matrix: {
                                  'a': scale[0],
                                  'b': 0,
                                  'c': 0,
                                  'd': scale[1] || scale[0],
                                  'e': translate[0],
                                  'f': translate[1],
                              }
                          };
                      },
                  },
              };
          } else {
              return {
                  baseVal: {
                      numberOfItems: 0,
                      consolidate: function() {
                          return null;
                      },
                  },
              };
          }
      },
  });
}


if (!('viewBox' in window.SVGElement.prototype)) {
  Object.defineProperty(window.SVGElement.prototype, 'viewBox', {
      get: function() {
          const viewBox = this.getAttribute('viewBox').split(' ');

          return {
              baseVal: {
                  x: +viewBox[0],
                  y: +viewBox[1],
                  width: +viewBox[2],
                  height: +viewBox[3],
              },
          };
      },
  });
}
