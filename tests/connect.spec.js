var io = require('socket.io-client')
  , Q = require('q')
var TIMEOUT = 1000;

describe("chatroom", function() {
  function async_it(name, cb) {
    var done = false
      , deferred = Q.defer()

    Q.when(deferred.promise, function() { done = true; });
    waitsFor(function() {
      return done;
    }, "completed", TIMEOUT);

    runs(function() {
    });

    cb(deferred);
  }

  it('connect', function(){
    async_it('connect', function(deferred) {
      var socket = io.connect('http://localhost:3000/?user=user1'
                              , {'force new connection': true });
      socket.on('connect', function() {
        socket.disconnect();

      }).on('error', function(err) {
        // NOTE: disconnect() will cause this error. this should be library's bug
        if(''+err !== 'Error: Stream closed unexpectedly.') {
          console.log(err);
          expect(false).toBeTruthy();
        }
        deferred.resolve();
      }).on('disconnect', function() {
        console.log('disconnect');
        deferred.resolve();
      });
    })
  });

  it('public_chat', function(){
    async_it('public_chat', function(deferred) {
      var d = Q.defer()
        , user1_connected = Q.defer()
        , user2_connected = Q.defer()
        , user1_received = Q.defer()
        , user2_received = Q.defer()
        , user1_msg = 'it is user1 speaking'
        , user2_msg = 'it is user2 speaking'
        , user1 = io.connect('http://localhost:3000/?user=user1'
                             , {'force new connection': true })
        , user2 = io.connect('http://localhost:3000/?user=user2'
                             , {'force new connection': true })

      user1.on('connect', function() {
        user1_connected.resolve();
      }).on('disconnect', function() {
        console.log('user1 disconnect');
      }).on('error', function(err) {
        // NOTE: disconnect() will cause this error. this should be library's bug
        if(''+err !== 'Error: Stream closed unexpectedly.') {
          console.log(err);
          expect(false).toBeTruthy();
        }
        user1_received.resolve();
      }).on('public_chat', function(data) {
        expect(data).toEqual(user2_msg);
        user1_received.resolve();
      });

      user2.on('connect', function() {
        user2_connected.resolve();
      }).on('disconnect', function() {
        console.log('user2 disconnect');
      }).on('error', function(err) {
        // NOTE: disconnect() will cause this error. this should be library's bug
        if(''+err !== 'Error: Stream closed unexpectedly.') {
          console.log(err);
          expect(false).toBeTruthy();
        }
        user2_received.resolve();
      }).on('public_chat', function(data) {
        expect(data).toEqual(user1_msg);
        user2_received.resolve();
      });

      Q.when(user1_connected.promise, function() {
        Q.when(user2_connected.promise, function() {
          user1.emit('public_chat', user1_msg);
          user2.emit('public_chat', user2_msg);
        })
      })

      Q.when(user1_received.promise, function() {
        Q.when(user2_received.promise, function() {
          user1.disconnect();
          user2.disconnect();
          deferred.resolve();
        })
      });
    })
  });
});