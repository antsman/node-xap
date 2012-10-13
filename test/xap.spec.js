'use strict';

var xap = require('../index'),
    dgram = require('dgram');


var FakeDgram = function () {
  var self = this;
  self.sent = [];
  self.closed = 0;

  this.setBroadcast = function (flag) {
    self.broadcastFlag = flag;
  };
  this.bind = function (port) {
    self.boundPort = port;
  };
  this.send = function (buf, offset, length, port, address, callback) {
    self.sent.push({
      buf: buf,
      offset: offset,
      length: length,
      port: port,
      address: address,
      callback: callback
    });
    callback();
  };
  this.close = function () {
    self.closed ++;
  };
}

describe('XAPBroadcaster', function () {

  describe('generateMessage', function () {
    it('should format a message appropriately', function () {
      var message = xap.generateMessage(
        'xap-header',
        {v: 12, hop: 1, uid: 'FF123400', class: 'xap-temp.notification',
         source: 'ACME.thermostat.lounge'});
      expect(message).toEqual(
        'xap-header\n{\nv=12\nhop=1\nuid=FF123400\nclass=xap-temp.notification\nsource=ACME.thermostat.lounge\n}\n')
    });
  });

  describe('instantiation', function () {
    it('should default to version 12 messages', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.version).toEqual(12);
    });
    it('should be possible to specify a version', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', version: 11, source: 'testing', uid: 'FF123400'});
      expect(transmitter.version).toEqual(11);
    });
    it('should configure the class from the options', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.class).toEqual('test');
    });
    it('should throw an error if no class is provided', function () {
      expect(function () {
        var transmitter = new xap.XAPBroadcaster(
          {source: 'test', uid: 'FF123400'});
      }).toThrow(new Error('Must provide a class.'));
    });
    it('should configure the source from the options', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.source).toEqual('testing');
    });
    it('should throw an error if no source is provided', function () {
      expect(function () {
        var transmitter = new xap.XAPBroadcaster(
          {class: 'test', uid: 'FF123400'});
      }).toThrow(new Error('Must provide a source.'));
    });
    it('should configure the uid from the options', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.uid).toEqual('FF123400');
    });
    it('should throw an error if no uid is provided', function () {
      expect(function () {
        var transmitter = new xap.XAPBroadcaster(
          {class: 'test', source: 'testing'});
      }).toThrow(new Error('Must provide a uid.'));
    });
    it('should be possible to provide a broadcast address', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400', broadcast: '192.168.1.255'});
      expect(transmitter.broadcast).toEqual('192.168.1.255');
    });
    it('should default to a broadcast address of 255.255.255.255', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.broadcast).toEqual('255.255.255.255');
    });
    it('should be possible to provide a port', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400', port: 1234});
      expect(transmitter.port).toEqual(1234);
    });
    it('should default to port 3639', function () {
      var transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});
      expect(transmitter.port).toEqual(3639);
    });
  });
  describe('.send', function () {
    var transmitter,
        fakeDgram,
        dgramSpy;
    beforeEach(function () {
      transmitter = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400',
         port: 1234, broadcast: '192.168.1.255'}),
        fakeDgram = new FakeDgram(),
        dgramSpy = spyOn(dgram, 'createSocket').andReturn(fakeDgram);
    });

    it('should with the correct network settings', function (done) {
      var sentMessage;

      transmitter.send('temp.current', {'temp': 25, 'units': 'C'}, done);

      expect(dgramSpy).toHaveBeenCalledWith('udp4');
      expect(fakeDgram.sent.length).toEqual(1);
      sentMessage = fakeDgram.sent[0];
      expect(sentMessage.offset).toEqual(0);
      expect(sentMessage.port).toEqual(1234);
      expect(sentMessage.address).toEqual('192.168.1.255');
    });
    it('should close the socket after transmitting', function () {
      transmitter.send('temp.current', {'temp': 25, 'units': 'C'});
      expect(fakeDgram.closed).toEqual(1);
    });
    it('should set the broadcast flag on the socket', function () {
      transmitter.send('temp.current', {'temp': 25, 'units': 'C'});
      expect(fakeDgram.broadcastFlag).toBeTruthy();
    });
    it('should bind to the the socket address', function () {
      transmitter.send('temp.current', {'temp': 25, 'units': 'C'});
      expect(fakeDgram.boundPort).toEqual(3639);
    });
    it('should send the correct header', function (done) {
      var sentMessage,
          expectedMessage;

      transmitter.send('temp.current', {'temp': 25, 'units': 'C'}, done);
      expectedMessage = xap.generateMessage(
        'xap-header',
        {v: 12, hop: 1, uid: 'FF123400', class: 'test', source: 'testing'});
      expectedMessage += xap.generateMessage(
        'temp.current', {'temp': 25, 'units': 'C'});
      sentMessage = fakeDgram.sent[0];
      expect(sentMessage.buf.toString()).toEqual(expectedMessage);
    });
    it('it should handle no callback', function () {
      transmitter.send('temp.current', {'temp': 25, 'units': 'C'});
    });
  });
});
