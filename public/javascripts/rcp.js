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
var rpcCall = function(name,params){
  callNum++;
  socket.emit('rpc',{method:name,params:params,id:callNum})
  
};
