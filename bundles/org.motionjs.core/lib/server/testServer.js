/**
 * This is a simple NodeJS server responsible for testing
 * Upon each request, the given test file is executed and the results are displayed
 */
var http = require("http")

if (process.argv.length == 5) {
	var testFile = process.argv[2]
	var portTestserver = process.argv[3]
	var portWebserver = process.argv[4]
} else {
  console.log('Invalid number of arguments. Pass <test-file> <port testserver> <port webserver>')
}

http.createServer(function(request, response) {

  var responseString = 
      '<html>' 
    + '<head>'
    + '<meta charset="utf-8"><title>Motion Test Server</title>'
    + '<link rel="stylesheet" href="http://localhost:' + portWebserver + '/file?name=bundles/org.motionjs.core/lib/test/nodeunit.css" type="text/css" />'   
    + '<script src="http://localhost:' + portWebserver + '/file?name=bundles/org.motionjs.core/lib/test/nodeunit.js" type="text/javascript" charset="utf-8"></script>'
    + '<script src="http://localhost:' + portWebserver + '/motion?port=' + portWebserver + '" type="text/javascript" charset="utf-8"></script>'
    + '<script type="text/javascript" charset="utf-8">var testSuite = {}</script>'
    + '<script src="http://localhost:' + portWebserver + '/file?name=' + testFile +'" type="text/javascript" charset="utf-8"></script>'
    + '<script type="text/javascript" charset="utf-8">'    
    + 'function runTests () { var testCases = {}; for (var key in testSuite) { testCases[key] = testSuite[key] }; nodeunit.run(testCases) };'   
    + '</script>'
    + '</head>'
    + '<body onload="runTests()"><h1 id="nodeunit-header">Example Test Suite</h1></body>'
    + '</html>'

  response.writeHead(200)
	response.end(responseString, "binary")
	
}).listen(portTestserver)
console.log('Test server running at http://localhost:' + portTestserver)
console.log('Visit test server to run the tests.')