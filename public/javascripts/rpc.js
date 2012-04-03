  dojo.require('dojox.rpc.Service');
  dojo.require('dojox.rpc.JsonRPC');
  
  var socket = io.connect('/');
  
  
  
  
var wsRpc = {
  callNum: 0,
  resultCBs: {},
  errorCBs: {},
  call : function(name,params,resultCB,errorCB){
    this.callNum++;
    var rpcObj = {method:name,params:params,id:this.callNum};
    //console.log('rpcObj for call',rpcObj);
    if(resultCB){
      this.resultCBs[this.callNum] = resultCB;
    }
    if(errorCB){
      this.errorCBs[this.callNum] = errorCB;
    }
    socket.emit('rpc',rpcObj);        
  }
};

socket.on('rpc',function(rpcObj){
  //console.log('rpcObj',rpcObj);
  try{
    if(rpcObj.error){
      if(wsRpc.errorCBs[rpcObj.id]){
        var error = rpcObj.error;
        wsRpc.errorCBs[rpcObj.id](error); 
      }
    }else{
      if(wsRpc.resultCBs[rpcObj.id]){
        var result = rpcObj.result;
        wsRpc.resultCBs[rpcObj.id](result); 
      }      
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
    wsRpc.call('square',dojo.byId('num1').value,
       function(result){
         dojo.byId('result').innerHTML = result;
         showElapsed(timeStart);
       }, 
       function(error){
         dojo.byId('result').innerHTML = 'ERROR:' + error;
         showElapsed(timeStart);
       }
    );
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