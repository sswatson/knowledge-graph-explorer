// Temporary workaround while we wait for https://github.com/facebook/jest/issues/9771
// See: https://github.com/facebook/jest/issues/9771#issuecomment-866293627
const resolver = require('enhanced-resolve').create.sync({
  conditionNames: ['require', 'node', 'default'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

module.exports = function (request, options) {
  if (request === 'fs') {
    return options.defaultResolver(request, options);
  }
  return resolver(options.basedir, request);
};
