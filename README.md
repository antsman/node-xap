To Install
----------

<pre>
    npm install xap
</pre>

To Use
------

<pre>
var xap = require('xap'),
    broadcaster = new xap.XAPBroadcaster(
        {class: 'test', source: 'testing', uid: 'FF123400'});

broadcaster.send('temp.current', {'temp': 25, 'units': 'C'});
</pre>

You probably want to hook it up to something that generates messages more
realistically, for example, to hook it up to [bigkevmcd rfxcom library](https://github.com/bigkevmcd/node-rfxcom) ...

<pre>
var RfxCom = require('rfxcom').RfxCom,
    xap = require('xap'),
    rfxcom = new RfxCom("/dev/ttyUSB0", {debug: true}),
    broadcaster = new xap.XAPBroadcaster(
        {class: 'Thermostat.status', source: 'rfxcom.WMR800.external', uid: 'FF123400'});

rfxcom.on("th3", function(evt) {
    broadcaster.send('temp.current', {'temp': evt.temperature, 'units': 'C'});
});

rfxcom.initialise();
</pre>
