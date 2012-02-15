/**
 * Load modules for given identifier and execute the callback once done
 * On the server, the loading is synchronous and therefore the callback can be called right away
 *
 * @param  {string}
 * @param  {function} Callback provided by consumer code
 * @param  {function} Callback as modified by the framework
 * @return {void}
 */
exports._loadModules = function (identifier, originalCallback, createCallback) {
  this._prepareObjectCreation(identifier, true)
  createCallback.call(null)
}
  
/**
 * Stores the module corresponding to given identifier in _modules
 *
 * @param  {string}
 * @return {void}
 */
exports._requireModule = function (identifier) {
  var moduleFile = './../../../' + this._getResource(identifier)
  try {
    this._modules[identifier] = require(moduleFile)
  } catch (e) {
    throw new Error('No module found for identifier ' + identifier + ', tried loading ' + moduleFile)
  }
}

/**
 * Turns an identifier into a resource
 * E.g. "org.motionjs.demo/vehicle/car" into "org.motionjs.demo/lib/vehicle/car"
 *
 * @param  {string}
 * @return {string}
 */
exports._getResource = function (identifier) {
  var identifierParts = identifier.split('/')
  identifierParts.splice(1, 0, 'lib')
  return identifierParts.join('/')
}

