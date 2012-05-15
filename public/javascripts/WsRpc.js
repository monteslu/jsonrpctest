define([
  'dojo/_base/declare',
  'dojo/dom',
  'dojo/on'
], function(declare,dom,on){

  return declare(null, {
    _callNum: 0,
    _deferreds: {},
    _names: [],
    socket: null,
    constructor: function(args){
      declare.safeMixin(this, args);


      if(!this.socket){
        console.warn('Must pass in an object with a socket property to this cosntructor. ex: {socket : mySocket}');
      }else{
        this.socket.emit = this.socket.emit || this.socket.send;

        //some socket function implementations need to execute in their own scope
        var parentObj = this;

        this.socket.on('smd',function(smdDef){
          console.log('smd ',smdDef);
          if(smdDef && smdDef.services){
            var sdefs = smdDef.services;
            for (var s in sdefs) {
              //console.log(this,s);
              parentObj[s] = (function(funcname,wsRpc){
                return function(){
                  //console.log('args',arguments);
                  wsRpc._callNum++;
                  var params = [];
                  for(var i = 0; i < arguments.length; i++){
                    params.push(arguments[i]);
                  }
                  var rpcObj = {method:funcname,params:params,id:wsRpc._callNum};

                  var deferred = new dojo.Deferred();
                  deferred.callNum = wsRpc._callNum;
                  wsRpc._deferreds[wsRpc._callNum] = deferred;
                  this.socket.emit('rpc',rpcObj);
                  return deferred;
                };
              })(s,parentObj);

            }
          }
        });

        this.socket.emit('smd',{});

        this.socket.on('rpc',function(rpcObj){
          console.log('rpcObj',rpcObj);
          try{
            if(rpcObj.error){
              if(parentObj._deferreds[rpcObj.id]){
                var error = rpcObj.error;
                parentObj._deferreds[rpcObj.id].errback(error);
              }
            }else{
              if(parentObj._deferreds[rpcObj.id]){
                var result = rpcObj.result;
                parentObj._deferreds[rpcObj.id].callback(result);
              }
            }
            if(parentObj._deferreds[rpcObj.id]){
              delete parentObj._deferreds[rpcObj.id];
            }
          }catch(e){
             console.log('malformed rpc response', rpcObj,e);
          }
        });
      }
    }
  });

});