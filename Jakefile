/**
 * Build file
 *
 * @author Michael Sauter
 */

var fs    = require('fs')
  , path  = require('path')
  , spawn   = require('child_process').spawn
  , child
  , helpers = require('./build/tools/helpers')
  , assembler = require('./bundles/org.motionjs.core/lib/assembler')

  

/**
 * Tasks
 */
desc('Default task')
task('default', [], function () {
	console.log('The following commands are available:')
	console.log('- test server <file>')
	console.log('- test client <file> <devserver port> <testserver port>')
	console.log('- deploy')
	console.log('- devserver <port>')
	console.log('- cache show')
	console.log('- cache add <identifier> <servedIdentifiers>')
	console.log('- cache delete <hash>')
	console.log('- cache delete all')
	console.log('- demo')
	console.log('- interface <identifier>')
})

desc('This the test task')
task('test', [], function (context, arg1, arg2, arg3) {
  if (context == 'client') {
    helpers.outputBold('Starting test server ...')
    if (typeof arg2 == 'undefined') {
      arg2 = 8081
    }
    if (typeof arg3 == 'undefined') {
      arg3 = 8080
    }
    var child1 = spawn('node', ['bundles/org.motionjs.core/lib/server/developmentServer.js', arg3])
    helpers.addOutput(child1)
    var child2 = spawn('node', ['bundles/org.motionjs.core/lib/server/testServer.js', arg1, arg2, arg3])
		helpers.addOutput(child2)		
  } else {
    helpers.outputBold('Running tests ...')
    child = spawn('nodeunit', [arg1])
    helpers.addOutput(child)
  }
})

desc('This is the deploy task')
task('deploy', [], function () { 
	helpers.outputBold('Running JSMin ...')
	helpers.outputBold('Moving files to web folder ...')
	
	// empty build/cache and web/scripts
	helpers.deleteFilesInDirectory(path.join(process.cwd(), 'build/cache'))
	helpers.deleteFilesInDirectory(path.join(process.cwd(), 'web/scripts'))	
	
	// create files in cache
	var fileCounter = 0
	var assembler = require(path.join(process.cwd(), 'bundles/org.motionjs.core/lib/assembler'))
	var cachedRequests = require(path.join(process.cwd(), 'build/cachedRequests')).cachedRequests 
	for (var hash in cachedRequests) {
    fileCounter++  
  }     
  for (var hash in cachedRequests) {
    helpers.writeRequestFile(hash, function () {
      fileCounter--
      if (fileCounter == 0) {
        writeMotionFile()
      }
    })   
  }
  
  // motion 
  function writeMotionFile () { 
    assembler.generateMotionResponse(function (error, responseString) {
      var cacheFilename = path.join(process.cwd(), 'build/cache/motion.js')    
      fs.writeFileSync(cacheFilename, responseString)
      minifyFiles()
    })  
  }
  
	// minify files in cache/ and move them to web/scripts/
	function minifyFiles () {
	  var cacheDir = 'build/cache/' 
  	var filenames = fs.readdirSync(path.join(process.cwd(), cacheDir))
  	for (var j = 0; j < filenames.length; j++) {
  		helpers.minifyFile(
  			filenames[j]
  		,	path.join(process.cwd(), cacheDir)
  		,	path.join(process.cwd(), 'web/scripts/')
  		);
  	}
  	console.log('Done.')
	}
})

desc('This is the cache task')
task('cache', [], function () {
  var args = Array.prototype.slice.call(arguments)
  var action = args.shift()
  
  switch (action) {
    case 'add':
      if (args.length < 1) {
        console.log('You need to provide at least one identifier. You may provide addtional served identifiers (comma-separated)')
        complete()
      } else {
        var servedString = ''
        if (args.length == 2) {
          servedString = args[1]
        }
        assembler.updateCachedRequests(args[0], servedString, false, function () {
          console.log('Added ' + args[0])
          complete()
        })
      }
    break      
    
    case 'show':
      var cachedRequests = require(path.join(process.cwd(), 'build/cachedRequests')).cachedRequests      
      for (var hash in cachedRequests) {
        console.log(hash 
          + ':\n\tRequested identifier: ' 
          + cachedRequests[hash].requestedIdentifier 
          + '\n\tServed identifiers: ' 
          + (cachedRequests[hash].servedString.length > 0 ? cachedRequests[hash].servedString : 'None') 
          + '\n\tLast used on: '
          + cachedRequests[hash].lastUsed)
      }
      complete()
    break
    
    case 'delete':
      if (args.length != 1) {
        console.log('You need to provide the hash to delete or "all" to delete all requests.')
        complete()
      } else {
        var fileContent = ''
        if (args[0] == 'all') {
          fileContent = 'exports.cachedRequests = {}'
          fs.writeFile(path.join(process.cwd(), 'build/cachedRequests.js'), fileContent, function (error) {
            if (error) throw error
            console.log('Cleared cached requests.')
            complete()
          })
        } else {
          var cachedRequests = require(path.join(process.cwd(), 'build/cachedRequests')).cachedRequests      
          delete cachedRequests[args[0]]
          fileContent = 'exports.cachedRequests = ' + JSON.stringify(cachedRequests)
          fs.writeFile(path.join(process.cwd(), 'build/cachedRequests.js'), fileContent, function (error) {
            if (error) throw error
            console.log('Deleted hash ' + args[0])
            complete()
          })
        }
      }
    break
    
    default:
      console.log('Unknown action, try "show", "add", "clear" or "delete".')
      complete()
    break
  }	
}, true)

desc('This the devserver task')
task('devserver', [], function (port) {
  helpers.outputBold('Starting development server ...')
  if (typeof port == 'undefined') {
    port = 8080
  }
  child = spawn('node', ['bundles/org.motionjs.core/lib/server/developmentServer.js', port])
  helpers.addOutput(child)
})

desc('This the demo task')
task('demo', [], function () {
  helpers.outputBold('Running demo script ...')
	child = spawn('node', ['bundles/org.motionjs.demo/lib/controller.js'])
	helpers.addOutput(child)
})

desc('This the interface task')
task('interface', [], function (givenIdentifier) {
  // setup core
  var motionjs = require('./bundles/org.motionjs.core/lib/core').motionjs
  var configuration = require('./configuration').configuration
  motionjs._setConfiguration(configuration)
  
  try {
    // handle identifier
    var identifier = motionjs._getRealIdentifier(givenIdentifier)
    var interfaceMethods = {}

    // add inherited methods to interface
    var capabilitiesOfIdentifier = motionjs._buildInheritanceChains(identifier, true)   
    for (var i = 0; i < motionjs._inheritanceChains[identifier].length; i++) {
      var inheritedIdentifier = motionjs._inheritanceChains[identifier][i]
      for (var key in motionjs._modules[inheritedIdentifier].definition) {
        if (typeof interfaceMethods[key] == 'undefined' 
          && typeof motionjs._modules[inheritedIdentifier].definition[key] == 'function' 
          && key.substring(0, 1) != '_') {
          var methodString = motionjs._modules[inheritedIdentifier].definition[key] + ''
          interfaceMethods[key] = methodString.substring(0, methodString.indexOf('{') - 1)
        }
      }
    }

    // display interface
    helpers.outputBold('Interface of "' + identifier + '":')
    for (var method in interfaceMethods) {
      console.log('- ' + method + ': ' + interfaceMethods[method])
    }
  } catch (e) {
    helpers.outputBold('Identifier "' + identifier + '" not found!')    
  }
})