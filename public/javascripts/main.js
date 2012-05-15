require({
  baseUrl: './',
  packages: [
    { name: 'dojo', location: '/javascripts/dojo-release-1.7.2/dojo' },
    { name: 'app', location: '/javascripts' }
  ]
}, [
  'dojo/dom',
  'dojo/on',
  'dojox/rpc/Service',
  'dojox/rpc/JsonRPC',
  'app/WsRpc'
], function(dom,on,Service,JsonRPC,WsRpc){

  var socket = io.connect('/');

  var wsrpc = new WsRpc({socket:socket});

  window.wsrpc = wsrpc;


  var ajaxRpc = new dojox.rpc.Service('/smd');

    on(document,'#wbutton:click',function(){
      var timeStart = Date.now();
      var aDeff = wsrpc.square(dom.byId('num1').value);
      aDeff.addCallback(function(result){
        dom.byId('result').innerHTML = result;
        showElapsed(timeStart);
      });
      aDeff.addErrback(function(result){
        dom.byId('result').innerHTML = 'ERROR:' + error;
        showElapsed(timeStart);
      });
    });


    on(document,'#abutton:click',function(){
      var timeStart = Date.now();
      var aDeff = ajaxRpc.square(dom.byId('num1').value);
      aDeff.addCallback(function(result){
        dom.byId('result').innerHTML = result;
        showElapsed(timeStart);
      });
      aDeff.addErrback(function(result){
        dom.byId('result').innerHTML = 'ERROR:' + error;
        showElapsed(timeStart);
      });
    });

  var showElapsed = function(timeStart){
    dom.byId('elapsedTime').innerHTML = getElapsed(timeStart);
  };

  var getElapsed = function(start){
    return Date.now() - start;
  };

});