/**
 * This is a simple NodeJS server responsible for various tasks in development context
 * The tasks are:
 * 1) Serving the motion core
 * 2) Serving an arbitrary file
 * 3) Serving an arbitrary identifier
 */
var http = require('http')
  , url = require('url')  
  , port = process.argv[2]
  , assembler = require('./../assembler')    

http.createServer(function(request, response) {
  var parsedUrl = url.parse(request.url, true)
  
  var callback = function (error, data) {
    if (error) {
      response.writeHead(500)
      response.end('Internal error: ' + error)
    } else {
      response.writeHead(200)
      response.end(data, 'binary')
    }    
  }
  
  switch (parsedUrl.pathname) {
    case '/motion':  
      var port = parsedUrl.query.port || ''       
      assembler.getMotionResponse(port, callback) 
    break
    
    case '/modules':    
	    var identifier = parsedUrl.query.identifier || ''
	    var servedString = parsedUrl.query.served || ''	  	 
	    assembler.getModulesResponse(identifier, servedString, callback)
	  break
	  
	  case '/file':
      var name = parsedUrl.query.name || ''
      assembler.getFileResponse(name, callback)        
    break;
    
    default:
      response.writeHead(404)
      response.end('Request could not be resolved to an action.')
    break
  }   
}).listen(port)
console.log('Development server running at http://localhost:' + port)