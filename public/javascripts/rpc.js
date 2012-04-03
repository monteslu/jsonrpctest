  dojo.require('dojox.rpc.Service');
  dojo.require('dojox.rpc.JsonRPC');
  //dojo.require('dojox.rpc.JsonRpc');
  dojo.require('dojox.io.scriptFrame');
  
  var randSession = 'ses' + Math.random();
  console.log(randSession);

  var socket = io.connect('/');
  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });

  socket.on('allpush', function (data) {
    console.log('allpush',data);
  });
  
  socket.on('sessionBroadcast', function (data) {
	    console.log('sessionBroadcast',data);
	  });
  
  socket.on('rpc',function(rpc){
    console.log('rpc result',rpc);
  });
  
  socket.emit('joinSession',{'sessionName':randSession});

  var send = function(sessionName,obj){
	dojo.xhrGet({	
	url: '/broadcastMessage',
	content: {
		sessionName: sessionName,
		json: dojo.toJson(obj)		
	},
	load: function(resp){
		console.log('push response',resp);
	},
	error: function(err){
		console.log('push error',err);
	},
	handleAs: 'json'
	});
}

var callNum = 0;
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
    if(rpcObj.result){
	if(wsRpc.resultCBs[rpcObj.id]){
	  var result = rpcObj.result;
	  wsRpc.resultCBs[rpcObj.id](result); 
	}
    }else if(rpcObj.error){
      if(wsRpc.errorCBs[rpcObj.id]){
	  var error = rpcObj.error;
	  wsRpc.errorCBs[rpcObj.id](error); 
      }
    }
  }catch(e){
     console.log('malformed rpc response', rpcObj,e);
  }
});

var rpc;
dojo.ready(function(){
  rpc = new dojox.rpc.Service('/smd');
});
