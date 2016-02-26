'use strict';

var dgram = require('dgram'),
    util = require('util');

/*
 * Generates an xAP message block, given a messageType and object.
 */
var generateMessage = function (messageType, message) {
    var body = messageType + '\n{\n';
    Object.keys(message).forEach(function(key) {
      body += util.format('%s=%s\n', key, message[key]);
    });
    body += '}\n';
    return body;
};

var XAPBroadcaster = function (options) {
  var self = this;
  options = options || {};

  self.version = options.version || 12;
  self.uid = options.uid;
  self.class = options.class;
  self.source = options.source;
  self.target = options.target;
  self.broadcast = options.broadcast || '255.255.255.255';
  self.port = options.port || 3639;

  if (typeof self.class === 'undefined') {
    throw new Error('Must provide a class.');
  }
  if (typeof self.source === 'undefined') {
    throw new Error('Must provide a source.');
  }
  if (typeof self.uid === 'undefined') {
    throw new Error('Must provide a uid.');
  }
}

XAPBroadcaster.prototype.send = function (messageType, message, callback) {
  var self = this,
      client = dgram.createSocket('udp4'),
      header = {v: self.version, hop: 1, uid: self.uid, class: self.class, source: self.source};

  if (typeof messageType === 'undefined') {
    throw new Error('Must provide a message type.');
  }

  if (typeof self.target != 'undefined') {
    header.target = self.target;
  }
  header = generateMessage('xap-header', header);
  var message = generateMessage(messageType, message);
  var buffer = new Buffer(header + message);

  client.bind(function() {
    client.setBroadcast(true);
    client.send(buffer, 0, buffer.length, self.port, self.broadcast, function(err, bytes) {
      client.close();
      if (typeof callback === 'function') {
        callback(err, bytes);
      }
    });
  });
}

exports.XAPBroadcaster = XAPBroadcaster;
exports.generateMessage = generateMessage;
