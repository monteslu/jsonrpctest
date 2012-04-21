dojo.require('dojox.rpc.Service');
dojo.require('dojox.rpc.JsonRPC');

var socket = io.connect('/');
  
  
  
var wsRpc = {
  _callNum: 0,
  _deferreds: {},
  _names: []
};

socket.on('smd',function(smdDef){
  console.log('smd ',smdDef);
  if(smdDef && smdDef.services){
    var sdefs = smdDef.services;
    


    for (s in sdefs) {
      
      
      wsRpc[s] = (function(){
        //console.log('adding rpc func: ',s, typeof s,arguments);
        var funcname = s;
        return function(){
          //console.log('args',arguments);
          wsRpc._callNum++;
          var params = [];
          for(var i = 0; i < arguments.length; i++){
            params.push(arguments[i]);
          }
          //console.log('params',params);
          var rpcObj = {method:funcname,params:params,id:wsRpc._callNum};
          //console.log('rpcObj for call',funcname,rpcObj);
          
          var deferred = new dojo.Deferred();
          deferred.callNum = wsRpc._callNum;
          wsRpc._deferreds[wsRpc._callNum] = deferred;
          socket.emit('rpc',rpcObj);
          return deferred;
        }
      })(s);

    }
  }

});

socket.on('rpc',function(rpcObj){
  console.log('rpcObj',rpcObj);
  try{
    if(rpcObj.error){
      if(wsRpc._deferreds[rpcObj.id]){
        var error = rpcObj.error;
        wsRpc._deferreds[rpcObj.id].errback(error); 
      }
    }else{
      if(wsRpc._deferreds[rpcObj.id]){
        var result = rpcObj.result;
        wsRpc._deferreds[rpcObj.id].callback(result);
      }
    }
    if(wsRpc._deferreds[rpcObj.id]){
      delete wsRpc._deferreds[rpcObj.id]; 
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
    var aDeff = wsRpc.square(dojo.byId('num1').value);
    aDeff.addCallback(function(result){
      dojo.byId('result').innerHTML = result;
      showElapsed(timeStart);
    });
    aDeff.addErrback(function(result){
      dojo.byId('result').innerHTML = 'ERROR:' + error; 
      showElapsed(timeStart);x 
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