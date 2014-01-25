var providers = {
//  "core": freedom.core(),
//  "storage.shared": freedom.storageShared(),
//  "storage.isolated": freedom.storageIsolated(),
//  "transport.webrtc": freedom.transportWebrtc()
};
// We need to keep track of want events we are already listening for
// so that we don't send duplicate notifcations events the helper.
var listeningFor = {};

// action = {
//  name: name to store provider under in 'providers' object, 
//  provider: name in manifest
// }
freedom.on('create', function(action) {
  providers[action.name] = freedom[action.provider]();
  listeningFor[action.name] = {};
});

// action = {
//  id: unique ID of call (tied to result), 
//  name: name of provider in 'providers' object, 
//  method: method to call, 
//  args: array of arguments to method}
freedom.on('call', function(action){
  var p = providers[action.provider];
	var promise = p[action.method].apply(null, action.args);
	promise.done(function(ret){
		freedom.emit('return', {
      id: action.id,
      data: ret
    });
	});
});

freedom.on('listenForEvent', function(listenEventInfo) {
  var providerName = listenEventInfo.provider;
  var eventName = listenEventInfo.event;
  var provider = providers[providerName];

  if (!listeningFor[providerName][eventName]) {
    provider.on(listenEventInfo.event, function (eventPayload) { 
      freedom.emit('eventFired', {provider: providerName,
                                  event: eventName,
                                  eventPayload: eventPayload});
    });
    listeningFor[providerName][eventName] = true;
  }
});
