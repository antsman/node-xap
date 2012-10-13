xAP Broadcast for Node.js
=========================

How to Use
==========

To install
----------

<pre>
  npm install xap
</pre>

To Use
------

<pre>
var xap = require('xap'),
    transmitter = new xap.XAPTransmitter(
        {class: 'test', source: 'testing', uid: 'FF123400'});

    transmitter.send('temp.current', {'temp': 25, 'units': 'C'});
</pre>

You probably want to hook it up to something that generates messages more
realistically, for example, to hook it up to my rfxcom library...

<pre>
var RfxCom = require('rfxcom').RfxCom,
    xap = require('xap'),
    rfxcom = new RfxCom("/dev/ttyUSB0", {debug: true}),
    transmitter = new xap.XAPTransmitter(
      {class: 'Thermostat.status', source: 'rfxcom.WMR800.external', uid: 'FF123400'});

rfxcom.on("th3", function(evt) {
  transmitter.send('temp.current', {'temp': evt.temperature, 'units': 'C'});
});

rfxcom.initialise();
</pre>
