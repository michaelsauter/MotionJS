/**
 * Helpers for Jakefile
 */
var fs    = require('fs')
  , jsmin = require('./jsmin').jsmin
  , util  = require('util')
  , path  = require('path')
  , assembler = require(path.join(process.cwd(), 'bundles/org.motionjs.core/lib/assembler'))	
  , cachedRequests = require(path.join(process.cwd(), 'build/cachedRequests')).cachedRequests      

/**
 * Print output of child
 *
 * @param  {process}
 * @return {void}
 */
exports.addOutput = function (child) {
	child.stdout.on('data', function (data) {
		util.print(data)
	})
	child.stderr.on('data', function (data) {
		util.print(data)
	})
}

/**
 * Delete all files in the given directory
 *
 * @param  {string}  Absolute path to directory
 * @return {void}
 */
exports.deleteFilesInDirectory = function (directory) {
  var files = fs.readdirSync(directory)
	
	for (var i = 0; i < files.length; i++) {
	  var filename = path.join(directory, files[i]) 
	  var stat = fs.statSync(filename)
	  if (stat.isFile()) {
	    fs.unlinkSync(filename)	  
	  }	  
	}
}
  
/**
 * Output string in bold type
 * 
 * @param  {string}
 * @return {void}
 */
exports.outputBold = function (message) {
	console.log("\033[1m" + message + "\033[0m");
}

/**
 * Minify file using JSMin
 * 
 * @param  {string} Original filename
 * @param  {string} Path to original file
 * @param  {string} Path to minified file
 * @return {void}
 */
exports.minifyFile = function (originalFilename, originalPath, minifiedPath) {
	var minifiedFilename, originalContent, minifiedContent = '';
	minifiedFilename = originalFilename.replace(/\.js/, '.min.js');
	var stat = fs.statSync(originalPath + originalFilename);
	if (stat.isFile()) {
		originalContent = fs.readFileSync(originalPath + originalFilename);
		minifiedContent = jsmin(originalContent.toString());
		fs.writeFileSync(minifiedPath + minifiedFilename, minifiedContent);
	}
}

/**
 * Writes request file referenced by hash in cache/build
 * 
 * @param  {string}   Hash for request
 * @param  {function} Callback
 * @return {void}
 */
exports.writeRequestFile = function (hash, callback) {  	
  var cacheFilename = path.join(process.cwd(), 'build/cache/' + hash + '.js')
  assembler.generateModulesResponse(cachedRequests[hash].requestedIdentifier, cachedRequests[hash].servedString, function (responseString) {            
    fs.writeFileSync(cacheFilename, responseString)
    callback.call(null)
  })
}