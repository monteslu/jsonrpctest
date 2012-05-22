define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/Deferred'
], function(declare, lang, array, Deferred){

  return declare(null, {
    _callNum: 0,
    _deferreds: {},
    socket: null,
    constructor: function(args){
      declare.safeMixin(this, args);
      this._create();
    },
    _create: function(){
      // Make sure we have a socket with send/emit and on
      if(!this.socket || !this.socket.on || (!this.socket.send || !this.socket.emit)){
        return console.warn('Must pass in an object with a socket property to this cosntructor. ex: {socket : mySocket}');
      }

      this.socket.emit = this.socket.emit || this.socket.send;

      // Make sure to hitch this because hitch is amazing -- and solves all your problems
      var simpleMethodDescription = lang.hitch(this, function(smdDefinition){
        var service;

        if(smdDefinition && smdDefinition.services){
          for(service in smdDefinition.services){
            this[service] = function(functionName){
              return function(){
                var params = []
                  , rpcObject
                  , deferred;
                this._callNum++;
                array.forEach(arguments, function(arg, idx){
                  params.push(arg);
                });
                rpcObject = {
                  method: functionName,
                  params: params,
                  id: this._callNum
                };
                deferred = new Deferred();
                deferred.callNum = this._callNum;
                this._deferreds[this._callNum] = deferred;
                this.socket.emit('rpc', rpcObject);
                return deferred;
              };
            }.call(this, service);
          }
        }
      });

      // Make sure to hitch this because hitch is amazing -- and solves all your problems
      var rpcCallback = lang.hitch(this, function(rpcObject){
        try{
          var id = rpcObject.id;
          if(this._deferreds[id]){
            if(rpcObject.error){
              this._deferreds[id].errback(rpcObject.error);
            } else {
              this._deferreds[id].callback(rpcObject.result);
            }
            delete this._deferreds[id];
          }
        } catch(e){
          console.log('malformed rpc response', rpcObject, e);
        }
      });

      // Register the websocket stuff
      this.socket.on('smd', simpleMethodDescription).emit('smd',{});
      this.socket.on('rpc', rpcCallback);
    }
  });

});