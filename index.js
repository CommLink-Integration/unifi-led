const UnifiLED = require('./unifi-led');

const unifiLED_IP = '192.168.2.2'
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

    if (await unifiLED.setGroupOutput(groups[0].id, true)) console.log(`${groups[0].name} is turned on.`)

    // Fade the first group up to full brightness by steps of 2 every 20ms
    for (let i = 0; i <= 100; i += 2) {
        setTimeout(() => {
            unifiLED.setGroupBrightness(groups[0], i);
        }, 20*i)
    }
})();

