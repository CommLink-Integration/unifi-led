# unifi-led
A Node.js package to connect to a Ubiquiti Unifi LED controller which allows for more programmatic control over devices and groups instead of being limited by the user-driven Ubiquiti interface.

This package can get information about connected lights and light groups as well as set the state and brightness of devices/groups.

Deeper down there is also detailed device information. Basically anything that can be viewed from the Ubiquiti EoT LED controller web UI can be accessed.

The API endpoints and usage were taken from the [Python unifiled repo](https://github.com/florisvdk/unifiled) by [florisvdk](https://github.com/florisvdk)

**TODO:**
- validate/improve error handling
- use `axios.all()` for setting multiple devices simultaneously

## Install
`npm install unifi-led`

## Quick start

```js
const UnifiLED = require('./unifi-led');

const unifiLED_IP = '172.16.2.2'
const user = 'user';
const pass = 'password';

(async () => {
    const unifiLED = await new UnifiLED({ip: unifiLED_IP, username: user, password: pass});

    const devices = await unifiLED.getDevices();
    // There will always be at least one group (All Lights) assuming there is at least one light adopted
    const groups = await unifiLED.getGroups(); 

    console.log(`There are ${devices.length} devices adopted by this controller.`);

    let countOn = 0;
    devices.forEach((device, index) => {
        if (device.status.output == 1) countOn++;
    })
    console.log(`${countOn} of ${devices.length} are powered on currently.`)

    groups.forEach((group, index) => {
        console.log(`The ID of group ${group.name} is ${group.id}. There are ${group.devices.length} devices in this group.`)
    })

    if (await unifiLED.setDeviceOutput(devices[0].id, true)) console.log(`${devices[0].name} is turned on.`)

    if (await unifiLED.setGroupOutput(groups[0].id, false)) console.log(`${groups[0].name} is turned off.`)

    // Fade the first group up to full brightness by steps of 2 every 20ms
    for (let i = 0; i <= 100; i += 2) {
        setTimeout(() => {
            unifiLED.setGroupBrightness(groups[0], i);
        }, 20*i)
    }
})();
```

<a name="UnifiLED"></a>

## UnifiLED
**Kind**: global class  

* [UnifiLED](#UnifiLED)
    * [new UnifiLED(params)](#new_UnifiLED_new)
    * [.getDevices()](#UnifiLED+getDevices) ⇒ <code>Array</code>
    * [.getGroups()](#UnifiLED+getGroups) ⇒ <code>Array</code>
    * [.setDeviceOutput(device, state)](#UnifiLED+setDeviceOutput) ⇒ <code>boolean</code>
    * [.setGroupOutput(group, state)](#UnifiLED+setGroupOutput) ⇒ <code>boolean</code>
    * [.setDeviceBrightness(device, brightness)](#UnifiLED+setDeviceBrightness) ⇒ <code>boolean</code>
    * [.setGroupBrightness(group, brightness)](#UnifiLED+setGroupBrightness) ⇒ <code>boolean</code>

<a name="new_UnifiLED_new"></a>

### new UnifiLED(params)
Create a Unifi LED connection session


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | <code>Object</code> |  |  |
| params.ip | <code>string</code> |  | The IP address of the unit |
| params.username | <code>string</code> |  | The username to connect as |
| params.password | <code>string</code> |  | The password used to connect |
| [params.port] | <code>number</code> | <code>20443</code> | The port number the unit is listening on |

<a name="UnifiLED+getDevices"></a>

### unifiLED.getDevices() ⇒ <code>Array</code>
Returns a list of devices adopted by the controller

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  
<a name="UnifiLED+getGroups"></a>

### unifiLED.getGroups() ⇒ <code>Array</code>
Returns a list of groups created in the controller web UI

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  
<a name="UnifiLED+setDeviceOutput"></a>

### unifiLED.setDeviceOutput(device, state) ⇒ <code>boolean</code>
Sets the on/off state for a single device

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  

| Param | Type | Description |
| --- | --- | --- |
| device | <code>string</code> | The id of the device to set. id values can be retrieved from getDevices()[i].id or getGroups().devices[i].id |
| state | <code>boolean</code> | true to turn the device on, false for off |

<a name="UnifiLED+setGroupOutput"></a>

### unifiLED.setGroupOutput(group, state) ⇒ <code>boolean</code>
Sets the on/off state for a group

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>string</code> | The id of the group to set. id values can be retrieved from getGroups()[i].id |
| state | <code>boolean</code> | true to turn the group on, false for off |

<a name="UnifiLED+setDeviceBrightness"></a>

### unifiLED.setDeviceBrightness(device, brightness) ⇒ <code>boolean</code>
Sets the brightness of a device

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  

| Param | Type | Description |
| --- | --- | --- |
| device | <code>string</code> | The id of the device to modify. id values can be retrieved from getDevices()[i].id or getGroups().devices[i].id |
| brightness | <code>Number</code> | The brightness of the device, in the range [0,100] |

<a name="UnifiLED+setGroupBrightness"></a>

### unifiLED.setGroupBrightness(group, brightness) ⇒ <code>boolean</code>
A convenience function that's a wrapper around setDeviceBrightness() for setting all of the devices in a group to one brightness.
This can be very noisy if modifying a large group and this._debug is set to true

**Kind**: instance method of [<code>UnifiLED</code>](#UnifiLED)  

| Param | Type | Description |
| --- | --- | --- |
| group | <code>string</code> | The group to modify. This should be an a member of the array returned by getGroups() |
| brightness | <code>Number</code> | The brightness of the group, in the range [0,100] |


## Format of getDevices() return value
```
[
    {
        isOnline: true, // whether or not the controller can access this device
        status: {
            led: 40, // current brightness setting
            output: 1, // if the device is on (1) or off (0)
            voltage: 51112, // instantaneous voltage in mV
            current: 179, // instantaneous current draw in mA
            energy: 5,
            power: 9149, // instantaneous power consumption in mW (voltage*current/1000)
            rimState: null,
            bleEnable: 1,
            pnpEnable: 1,
            pirSense: null,
            lightOnTimeout: null,
            mode: null,
            triggerMode: null
        },
        info: {
            uptime: 3432574, // uptime in seconds, this doesn't seem to always match the controller web UI, maybe an overflow somewhere
            version: 'v3.8.26-236r', // current firmware version
            devFwUpgrade: 'null',
            model: 'ULED-AT' || 'ULED-AC' || 'UDIM-AT',
            outgoingIface: 'eth0'
        },
        id: 'a43e77d7-8e87-47a0-87d1-2fea1d6c3222', // UID for controlling this device
        name: 'LIGHT-5277D2', // optional friendly name if configured in the controller
        hostname: 'ULP2PE2-5277D2', // factory assigned hostname
        mac: '00:00:de:ad:be:ef',
        ethMac: '00:00:de:ad:be:ef',
        wifiMac: null,
        ip: '172.16.2.44', // the device's IP address
        adopted: true,
        adoptedAt: '2021-09-03T15:44:16.409Z',
        platform: 'ULP2PE2',
        type: 'LED' || 'DIMMER',
        state: 'ONLINE' || 'OFFLINE', // whether or not the controller can access this device
        supportsCustomUpgrade: true
    },
    ...
]
```

## Format of getGroups() return value
```
[
    {
        name: 'My Group 1', // the friendly name of the group configured via the web UI
        displayRecentPowerConsumptionChart: true,
        id: 'c4bea315-ac78-4cf2-86bb-288f37b53477',  // UID for controlling this group
        devices: [ // an array of devices in this group. the information in each array member is (more-or-less) a subset of the information included when getting a single device
            {
            id: 'a43e77d7-8e87-47a0-87d1-2fea1d6c3222',
            name: 'LIGHT-5277D2',
            },
            ...
        ],
        energy: 48352, // total instantaneous power consumption for the group
        led: 40, // the brightness of the group
        output: 1, // if the group is on (1) or off (0)
        devicesTurnedOn: 4 // number of devices in the group that are on
    },
    ...
]
```


## Authors

* **Hunter Grayson** - [hunter-hunter](https://github.com/hunter-hunter)

See also the list of [contributors](https://github.com/CommLink-Integration/unifi-led/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019)