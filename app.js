
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

var jsonRpc = function(req,resp){
  if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {

            try{
	      rpc = JSON.parse(body);
	      console.log('rpc',rpc);
	      rpcFunctions[rpc.method](rpc.params,
		function(result){
		  resp.send({result:result,error:null,id:rpc.id});
		},
		function(error){
		  resp.send({result:null,error:error,id:rpc.id});
		});
	    }catch(e){
	      resp.send({result:null,error:e,id:0});
	      
	    }

        });
   }
   else{
      
      
   }
  
  
};

app.get('/jsonrpc', function(req,resp){
  jsonRpc(req,resp);
});

app.post('/jsonrpc', function(req,resp){
  jsonRpc(req,resp);
});

var rpcFunctions = {
  getStuff: function(args,resultCB, errCB){
    resultCB('stuff');
  },
  getMoreStuff: function(args,resultCB,errCB){
    resultCB({moar:'stuff!'});
  },
  add: function(args,resultCB,errCB){
    try{
      resultCB(args[0] + args[1]);
    }catch(e){
       errCB(e); 
    }
    
  },
  divide: function(args,resultCB,errCB){
    try{
      resultCB(args[0] / args[1]);
    }catch(e){
       errCB(e); 
    }
    
  },
  square: function( args, resultCB, errCB){
    try{
      resultCB(args * args);
    }catch(e){
       errCB(e); 
    }
  }
  
};

app.get('/smd',function(req,resp){
  var smd = {
    target:"/jsonrpc", // this defines the URL to connect for the services
    transport:"POST", // We will use POST as the transport
    envelope:"JSON-RPC-1.0", // We will use JSON-RPC
    SMDVersion:"2.0",
    services: {}
  };
  
  for(func in rpcFunctions){
    smd.services[func] = {}; 
  }
  
  resp.send(smd);
  
});






app.listen(3001);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);





io.sockets.on('connection', function (socket) {
  
  

  socket.on('rpc',function(rpc){
    console.log('rpc',rpc);
    if(rpcFunctions[rpc.method]){
      var retVal;
      var error;
      try{
	rpcFunctions[rpc.method](rpc.params,
		function(result){
		  socket.emit('rpc',{result: result, error: null, id: rpc.id});
		},
		function(error){
		  socket.emit('rpc',{result: null, error: error, id: rpc.id});
		});
      }catch(e){
	socket.emit('rpc',{result: null, error: e, id: rpc.id});
      }
      
    }else{
      socket.emit('rpc',{result: null, error: 'method undefined', id: rpc.id});
    }
    
  });
  
  
  

});

