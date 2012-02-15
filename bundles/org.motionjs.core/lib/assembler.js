var motionjs = require('./core').motionjs
  , configuration = require('./../../../configuration').configuration
  , path = require('path')
  , fs = require('fs')
  , requiredIdentifiers = {}
  
motionjs._setConfiguration(configuration)

/**
 * Returns the identifiers that need to be served for given 
 * identifer / previouslyRequestedIdentifiers combination
 *
 * @param  {string}
 * @param  {array}
 * @return {array}
 */
var getIdentifiersToServe = function (identifier, previouslyRequestedIdentifiers) {
  var identifiersRequiredByIdentifier = []
    , identifiersToServeForRequest = []
    , identifiersServedToRequestingClient = getServedIdentifiers(previouslyRequestedIdentifiers)
 
  // inheritance chain
  identifier = motionjs._getRealIdentifier(identifier)
  motionjs._buildInheritanceChains(identifier, true)
  identifiersRequiredByIdentifier = motionjs._inheritanceChains[identifier]
  
  // inheritance chains of dependencies
  if (motionjs._modules[identifier].configuration.dependencies) {
 	  for (var dependencyIdentifier in motionjs._modules[identifier].configuration.dependencies) {
 	    dependencyIdentifier = motionjs._getRealIdentifier(dependencyIdentifier)
 	    motionjs._buildInheritanceChains(dependencyIdentifier, true)
 	    identifiersRequiredByIdentifier = identifiersRequiredByIdentifier.concat(motionjs._inheritanceChains[dependencyIdentifier])
    }
  }

  requiredIdentifiers[identifier] = identifiersRequiredByIdentifier
  for (var i = 0; i < identifiersRequiredByIdentifier.length; i++) {
    if (typeof identifiersServedToRequestingClient[identifiersRequiredByIdentifier[i]] == 'undefined') {
      identifiersToServeForRequest.push(identifiersRequiredByIdentifier[i])
    }
  }

  return identifiersToServeForRequest
}

/**
 * Returns the identifiers that have been served already
 * This can be calculated from the identifiers that have been requested in the past
 *
 * @param  {array}
 * @return {array}
 */
var getServedIdentifiers = function (previouslyRequestedIdentifiers) {
  var servedIdentifiers = {}
  for (var i = 0; i < previouslyRequestedIdentifiers.length; i++) {
    var identifiersServedTemp = requiredIdentifiers[previouslyRequestedIdentifiers[i]] 
    for (var j = 0; j < identifiersServedTemp.length; j++) {
      if (typeof servedIdentifiers[identifiersServedTemp[j]] == 'undefined') {
        servedIdentifiers[identifiersServedTemp[j]] = true
      }
    }
  }

  return servedIdentifiers
}

/**
 * Reads a file and calls the given callback upon completion
 *
 * @param  {string}   Filename
 * @param  {function} Callback that receives error and data
 * @return {void}
 */
exports.getFileResponse = function (name, callback) {
  fs.readFile(path.join(process.cwd(), name), callback)
}

/**
 * Gets the motion file
 *
 * @param  {string}   Port number of development server
 * @param  {function} Callback that receives error and data
 * @return {void}
 */
exports.getMotionResponse = function (port, callback) {  
  this.generateMotionResponse(function (error, responseString) { 
    if (error) {
      callback.call(null, 'MotionJS could not be loaded')
    } else {
      callback.call(null, undefined, responseString + ';motionjs._developmentPort=' + port + ';')
    }
  })
}

/**
 * Gets the modules which need to be served and updates the cached requests
 *
 * @param  {string}   Requested identifier
 * @param  {string}   Already served identifiers (comma-separated)
 * @param  {function} Callback that receives error and data
 * @return {void}
 */
exports.getModulesResponse = function (identifier, servedString, callback) {    
  this.updateCachedRequests(identifier, servedString, true)     
  this.generateModulesResponse(identifier, servedString, function (responseString) {    
    callback.call(null, undefined, responseString)
  })
}

/**
 * Reads core, adapter and configuration file and combines them into one response
 *
 * @param  {function} Callback to call when all 3 files are loaded
 * @return {void}
 */
exports.generateMotionResponse = function (callback) {
  var responseString = ''
  try {
    fs.readFile(path.join(process.cwd(), 'bundles/org.motionjs.core/lib/core.js'), function (error, data) {
      if (error) { throw error } 
      responseString += data + '\n'
      fs.readFile(path.join(process.cwd(), 'bundles/org.motionjs.core/lib/adapter/client.js'), function (error, data) {
        if (error) { throw error } 
        responseString += data + '\n'
        fs.readFile(path.join(process.cwd(), 'configuration.js'), function (error, data) {
          if (error) { throw error } 
          responseString +=
        		'motionjs._setConfiguration((function () {\n' +
        		'var exports = {}\n' +
        		data + '\n' +
        		'return exports.configuration\n' +
        		'})())'
        	callback.call(null, undefined, responseString)
        })
      })  
    })
  } catch (exception) {
    callback.call(null, true, undefined)
  }
}

/**
 * Reads modules needed for identifier (except those already served)
 * It also updates the cached requests
 *
 * @param  {string}   Requested identifier
 * @param  {string}   Already served identifiers (comma-separated) 
 * @param  {function} Function to call when all modules have been read
 * @return {void}
 */
exports.generateModulesResponse = function (identifier, servedString, callback) {
  var responseString = ''   
    , fileToLoad = ''   
    , servedIdentifiers = []
    , identifiersToRead = 0
    
  if (servedString.length > 0) {
    servedIdentifiers = servedString.split(',')
  }  
  
  var addFileContents = function (identifierToRead) {
    fileToLoad = path.join(process.cwd(), 'bundles/' + motionjs._getResource(identifierToRead) + '.js')  
    fs.readFile(fileToLoad, function (error, data) {        
      if (error) {
        throw error
      } else {
        responseString +=
    			'motionjs._addModule("' + identifierToRead + '", (function () {\n' +
    			'var exports = {};\n' +
    			data + '\n' +
    			'return exports;\n' +
    			'})());\n\n'
        identifiersToRead--
        if (identifiersToRead == 0) {         
          responseString += 'motionjs._executeSuccessCallback("' + identifier + '");'
          callback.call(null, responseString)
        }          
      }        
    })
  }

  try {
    var identifiersToServe = getIdentifiersToServe(identifier, servedIdentifiers)     
    identifiersToRead = identifiersToServe.length     
    for (var i = 0; i < identifiersToRead; i++) {
      addFileContents(identifiersToServe[i])            
    }
  } catch (exception) {
    callback.call(null, 'motionjs._executeErrorCallback("' + identifier + '", "' + exception.message + '");')
  }
}

/**
 * Either inserts a new hash into the cached requests or updates an existing one
 *
 * @param  {string}   Requested identifier
 * @param  {string}   Already served identifiers (comma-separated) 
 * @param  {boolean}  True if date should be updated 
 * @param  {function} Callback to call when file is written
 * @return {string}
 */
exports.updateCachedRequests = function (identifier, servedString, updateLastUsed, callback) {
  var hash = motionjs._getHash(identifier, '+', servedString)
  var cachedRequests = require(path.join(process.cwd(), 'build/cachedRequests')).cachedRequests
  if (typeof cachedRequests[hash] == 'undefined') {
    cachedRequests[hash] = {'requestedIdentifier': identifier, 'servedString': servedString, 'lastUsed': 'Never'}
  } 
  if (updateLastUsed) {
    cachedRequests[hash].lastUsed = (new Date()).toLocaleString()
  }
  
  var cachedRequestsFileContent = 'exports.cachedRequests = ' + JSON.stringify(cachedRequests)
  
  fs.writeFile(path.join(process.cwd(), 'build/cachedRequests.js'), cachedRequestsFileContent, function (error) {
    if (error) throw error      
    if (typeof callback == 'function') {
      callback.call()
    }
  });
}