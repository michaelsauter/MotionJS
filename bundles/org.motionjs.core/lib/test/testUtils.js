/**
 * This module provide helper functions for the unit testing
 * Every test file on the server depends on this module
 */
 
var path = require('path')

/**
 * Export testCase function from nodeunit
 */
exports.testCase = require('nodeunit').testCase

/**
 * Requires a module and makes sure it is never served from the cache
 *
 * @param  {string} Module name
 * @return {object}
 */
exports.getFreshModule = function (name) {
  var moduleName = path.join(process.cwd(), 'bundles/' + name)
  if (typeof require.cache[moduleName + '.js'] != 'undefined') {
    delete require.cache[moduleName + '.js']
  }
  return require(moduleName)
}