/**
 * Will be used to store callbacks by identifier
 * Every identifier can have multiple callbacks stored
 */
motionjs._loadModulesCallbacks = {}

/**
 * Identifiers that have been requested earlier are stored in here
 * They are given to the server along with an identifier request so that the server can determine
 * which identifiers don't need to be send back to the client
 */
motionjs._servedIdentifiers = []

/**
 * Load modules for given identifier and execute the callback once done
 * On the client, we start the loading and store the callback for future use once loading is done
 *
 * @param  {string}
 * @param  {function} Callback provided by consumer code
 * @param  {function} Callback as modified by the framework
 * @return {void}
 */
motionjs._loadModules = function (identifier, originalCallback, createCallback) {
  var self = this
  if (typeof this._loadModulesCallbacks[identifier] == 'undefined') {
    this._loadModulesCallbacks[identifier] = []
  }
  this._loadModulesCallbacks[identifier].push(
    { success: function () {
        self._servedIdentifiers.push(identifier)
        self._prepareObjectCreation(identifier, false)
        createCallback.call(self)
      }
    , error: originalCallback
    }
  )
  
  var servedIdentifiers = this._servedIdentifiers.join(',')
  
  var url = ''
  if (this._configuration.mode == 'production') {
    url = 'scripts/' + this._getHash(identifier, '+', servedIdentifiers) + '.min.js'
  } else {
    // _developmentPort is set via the development server
    url = 'http://localhost:' + this._developmentPort + '/modules?identifier=' + identifier + '&served=' + servedIdentifiers
  }
  this._appendScript(url)
}

/**
 * Appends a new script element to the head, with src set to given url
 *
 * @param  {string}
 * @return {void}
 */
motionjs._appendScript = function (url) {
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	head.appendChild(script);
}

/**
 * This function is called at the end of every served identifier reponse to signal loading is done
 * Therefore, it executes the callback which was stored in the _loadModules function
 *
 * @param  {string}
 * @return {void}
 */	
motionjs._executeSuccessCallback = function (identifier) {
  this._loadModulesCallbacks[identifier].shift().success.call(null)
}

/**
 * This function is called if an error occurd while serving an identifier
 * Therefore, it executes the error callback which was stored in the _loadModules function
 *
 * @param  {string}
 * @param  {string}
 * @return {void}
 */
motionjs._executeErrorCallback = function (identifier, errorMessage) { 
  this._loadModulesCallbacks[identifier].shift().error.call(null, errorMessage, undefined)
}