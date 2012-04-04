dojo.require('dojox.rpc.Service');
dojo.require('dojox.rpc.JsonRPC');

var socket = io.connect('/');
  
  
  
  
var wsRpc = {
  callNum: 0,
  deferreds: {},
  call : function(name){
    this.callNum++;
    var params = [];
    if(arguments.length > 1){
      for(var i = 1; i < arguments.length; i++){
        params.push(arguments[i]);
      }
    }
    var rpcObj = {method:name,params:params,id:this.callNum};
    //console.log('rpcObj for call',rpcObj);
    
    var deferred = new dojo.Deferred();
    deferred.callNum = this.callNum;
    this.deferreds[this.callNum] = deferred;
    socket.emit('rpc',rpcObj);
    return deferred;
  }
};

socket.on('rpc',function(rpcObj){
  //console.log('rpcObj',rpcObj);
  try{
    if(rpcObj.error){
      if(wsRpc.deferreds[rpcObj.id]){
        var error = rpcObj.error;
        wsRpc.deferreds[rpcObj.id].errback(error); 
      }
    }else{
      if(wsRpc.deferreds[rpcObj.id]){
        var result = rpcObj.result;
        wsRpc.deferreds[rpcObj.id].callback(result);
      }
    }
    if(wsRpc.deferreds[rpcObj.id]){
      delete wsRpc.deferreds[rpcObj.id]; 
    }
  }catch(e){
     console.log('malformed rpc response', rpcObj,e);
  }
});

var ajaxRpc;
dojo.ready(function(){
  ajaxRpc = new dojox.rpc.Service('/smd');
  
  dojo.connect(dojo.byId('wbutton'),'onclick',function(){
    var timeStart = Date.now();
    var aDeff = wsRpc.call('square',dojo.byId('num1').value);
    aDeff.addCallback(function(result){
      dojo.byId('result').innerHTML = result;
      showElapsed(timeStart);
    });
    aDeff.addErrback(function(result){
      dojo.byId('result').innerHTML = 'ERROR:' + error; 
      showElapsed(timeStart);
    }); 
  });
  
  
  dojo.connect(dojo.byId('abutton'),'onclick',function(){
    var timeStart = Date.now();
    var aDeff = ajaxRpc.square(dojo.byId('num1').value);
    aDeff.addCallback(function(result){
      dojo.byId('result').innerHTML = result;
      showElapsed(timeStart);
    });
    aDeff.addErrback(function(result){
      dojo.byId('result').innerHTML = 'ERROR:' + error; 
      showElapsed(timeStart);
    });  
  });
  
  
});

var showElapsed = function(timeStart){
  dojo.byId('elapsedTime').innerHTML = getElapsed(timeStart);
};

var getElapsed = function(start){
  return Date.now() - start;  
};