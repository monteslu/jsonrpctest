
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


app.get('/jsonrpc', function(req,resp){
  jsonRpc(req.query.rpc,resp);
});

app.post('/jsonrpc', function(req,resp){
  var body = '';
  req.on('data', function (data) {
    body += data;
  });
  req.on('end', function () {
    jsonRpc(body,resp);
  });
  
});
  

var jsonRpc = function(rpcStr,resp){
  try{
    console.log('rpcStr: ', rpcStr);
    rpc = JSON.parse(rpcStr);
    console.log('rpc: ', rpc, typeof rpc);
    var params = [];
    params[0] = function(result){
      resp.send({result: result, error: null, id: rpc.id});
    };
    params[1] = function(error){
      resp.send({result: null, error: error, id: rpc.id});
    };
    if(rpc.params && rpc.params.length){
      for(var i = 0; i < rpc.params.length; i++){
	console.log('adding param: ', i, rpc.params[i]);
	params.push(rpc.params[i]);  
      }
    }
    rpcFunctions[rpc.method].apply(rpcFunctions[rpc.method],params);
  }catch(e){
    resp.send({result:null,error:e,id:0});
    
  }
  
};



var rpcFunctions = {
  getStuff: function(resultCB, errCB){
    resultCB('stuff');
  },
  getMoreStuff: function(resultCB,errCB){
    resultCB({moar:'stuff!'});
  },
  add: function(resultCB,errCB,num1,num2){
    try{
      console.log('add num1:',num1, ' num2:', num2)
      resultCB(num1 + num2);
    }catch(e){
       errCB(e); 
    }
    
  },
  divide: function(resultCB,errCB,dividend,divisor){
    try{
      resultCB(dividend / divisor);
    }catch(e){
       errCB(e); 
    }
    
  },
  square: function(resultCB, errCB, num){
    try{
      resultCB(num * num);
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






app.listen(16564);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);





io.sockets.on('connection', function (socket) {

  socket.on('rpc',function(rpc){
    console.log('rpc obj: ',rpc);
    if(rpcFunctions[rpc.method]){
      var retVal;
      var error;
      try{
        var params = [];
        params[0] = function(result){
          socket.emit('rpc',{result: result, error: null, id: rpc.id});
        };
        params[1] = function(error){
          socket.emit('rpc',{result: null, error: error, id: rpc.id});
        };
        if(rpc.params && rpc.params.length){
          for(var i = 0; i < rpc.params.length; i++){
            console.log('adding param: ', i, rpc.params[i]);
            params.push(rpc.params[i]);  
          }
        }
        rpcFunctions[rpc.method].apply(rpcFunctions[rpc.method],params);
      }catch(e){
        socket.emit('rpc',{result: null, error: e, id: rpc.id});
      }
    }else{
      socket.emit('rpc',{result: null, error: 'method undefined', id: rpc.id});
    }
    
  });
  

});

