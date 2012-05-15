
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);

//Configuration

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
  jsonRpc(req.query.rpc,req,resp,req.query.callback);
});

app.post('/jsonrpc', function(req,resp){
  var body = '';
  req.on('data', function (data) {
    body += data;
  });
  req.on('end', function () {
    jsonRpc(body,req,resp);
  });

});


var jsonRpc = function(rpcStr,req,resp,jsonpCallback){
  try{
    console.log('rpcStr: ', rpcStr);
    rpc = JSON.parse(rpcStr);
    console.log('rpc: ', rpc, typeof rpc);
    var params = [];
    if(rpc.params && rpc.params.length){
      for(var i = 0; i < rpc.params.length; i++){
	     console.log('adding param: ', i, rpc.params[i]);
	     params.push(rpc.params[i]);
      }
    }
    rpcFunctions[rpc.method].apply({
      resultCB: function(result){
        var rpcObj = {result: result, error: null, id: rpc.id};
        if(jsonpCallback){
          resp.send(jsonpCallback + '(' + JSON.stringify(rpcObj) + ');');
        }else{
          resp.send(rpcObj);
        }
      },
      errorCB: function(error){
        var rpcObj = {result: null, error: error, id: rpc.id}
        if(jsonpCallback){
          resp.send(jsonpCallback + '(' + JSON.stringify(rpcObj) + ');');
        }else{
          resp.send(rpcObj);
        }
      },
      request: req

      },params);
  }catch(e){
    resp.send({result:null,error:e,id:0});

  }

};



var rpcFunctions = {
  getStuff: function(){
    if(this.request){
      this.resultCB({query: this.request.query});
    }else{
      this.resultCB({socketId: this.socket});
    }
  },
  getMoreStuff: function(){
    this.resultCB({moar:'stuff!'});
  },
  add: function(num1,num2){
    try{
      console.log('add num1:',num1, ' num2:', num2)
      this.resultCB(num1 + num2);
    }catch(e){
      this.errorCB(e);
    }
  },
  divide: function(dividend,divisor){
    try{
      this.resultCB(dividend / divisor);
    }catch(e){
      this.errorCB(e);
    }
  },
  square: function( num){
    try{
      this.resultCB(num * num);
    }catch(e){
       this.errorCB(e);
    }
  }
  ,
  badStuff: function(num){
       this.errorCB('bad stuff!');
  }
};

app.get('/smd',function(req,resp){

  resp.send(getSMD());

});

getSMD = function(){
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
  return smd;
};





app.listen(17699);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);





io.sockets.on('connection', function (socket) {

  console.log('newsocket',socket);

  socket.on('rpc',function(rpc){
    console.log('rpc obj: ',rpc);
    if(rpcFunctions[rpc.method]){
      var retVal;
      var error;
      try{
        var params = [];
        if(rpc.params && rpc.params.length){
          for(var i = 0; i < rpc.params.length; i++){
            console.log('adding param: ', i, rpc.params[i]);
            params.push(rpc.params[i]);
          }
        }
        rpcFunctions[rpc.method].apply({
          resultCB: function(result){
            socket.emit('rpc',{result: result, error: null, id: rpc.id});
          },
          errorCB: function(error){
            socket.emit('rpc',{result: null, error: error, id: rpc.id});
          },
          socket: socket

          },params);
      }catch(e){
        socket.emit('rpc',{result: null, error: {'rpcError':e}, id: rpc.id});
      }
    }else{
      socket.emit('rpc',{result: null, error: 'method undefined', id: rpc.id});
    }

  });

  socket.on('smd',function(rpc){
    socket.emit('smd',getSMD());
  });


});

