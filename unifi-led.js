const https = require('https');
const axios = require('axios');

class UnifiLED {
    /**
     * Create a Unifi LED connection session
     * @param {Object} params
     * @param {string} params.ip - The IP address of the unit
     * @param {string} params.username - The username to connect as
     * @param {string} params.password - The password used to connect
     * @param {number} [params.port=20443] - The port number the unit is listening on
     */
    constructor({ ip, port = 20443, username, password }) {
        this._debug = true;
        this.baseUrl = `https://${ip}:${port}`;
        this.username = username;
        this.password = password;
        this._accessToken = '';
        this._agent = new https.Agent({  
            rejectUnauthorized: false
        });
        this._headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': 'Bearer ' + this._accessToken
        }

        return (async () => { 
            await this._login(); 
            return this;
        })();
    }

    /**
     * Attempts to login using the class instance username and password
     * Sets the 'Authorization: Bearer <token>' header on success
     * @returns {boolean}
     */
    _login() {
        const options = {
            url: this.baseUrl+'/v1/login',
            method: 'POST',
            httpsAgent: this._agent,
            data: {
                username: this.username,
                password: this.password
            }
        }

        if (this._debug) console.log('Attempting to login using Unifi LED credentials')
        
        return axios(options)
        .then(res => {
            // console.log(res)
            this._headers.Authorization = 'Bearer ' + res.data.access_token
            return true;
        })
        .catch(err => {
            console.error('Could not login to Unifi LED. Check connection, username and password and retry.')
            return false;
        })
    }

    /**
     * Returns a list of devices adopted by the controller
     * @returns {Array}
     */
    getDevices() {
        const options = {
            url: this.baseUrl+'/v1/devices',
            method: 'GET',
            httpsAgent: this._agent,
            headers: this._headers
        }

        if (this._debug) console.log('Attempting to get Unifi LED devices.')

        return axios(options)
        .then(res => {
            return res.data
        })
        .catch(async (err) => {
            if (err.response.status == 403) {
                console.error('403 Unauthorized access. Trying to login.');
                // Try to login one time assuming the access_token has expired since the last request
                if (await this._login()) return this.getDevices();
                else {
                    console.error(err.error)
                    return undefined;
                }
            }
        })
    }

    /**
     * Returns a list of groups created in the controller web UI
     * @returns {Array}
     */
    getGroups() {
        const options = {
            url: this.baseUrl+'/v1/groups',
            method: 'GET',
            httpsAgent: this._agent,
            headers: this._headers
        }

        if (this._debug) console.log('Attempting to get Unifi LED groups.')

        return axios(options)
        .then(res => {
            return res.data
        })
        .catch(async (err) => {
            if (err.response.status == 403) {
                console.error('403 Unauthorized access. Trying to login.');
                // Try to login one time assuming the access_token has expired since the last request
                if (await this._login()) return this.getGroups();
                else {
                    console.error(err.error)
                    return undefined;
                }
            }
        })
    }

    /**
     * Sets the on/off state for a single device
     * @param {string} device - The id of the device to set. id values can be retrieved from getDevices()[i].id or getGroups().devices[i].id
     * @param {boolean} state - true to turn the device on, false for off
     * @returns {boolean}
     */
    setDeviceOutput(device, state) {
        if (this._debug) console.log(`Attempting to set Unifi LED device ${device} state to ${state ? 'on' : 'off'}`)

        const requestOutput = state ? 1 : 0;
        const options = {
            url: this.baseUrl + `/v1/devices/${device}`,
            method: 'PUT',
            httpsAgent: this._agent,
            headers: this._headers,
            data: {
                command: 'config-output',
                value: requestOutput
            }
        }

        return axios(options)
        .then(res => {
            return res.data['DeviceStatus.output'] == requestOutput;
        })
        .catch(async (err) => {
            if (err.response.status == 403) {
                console.error('403 Unauthorized access. Trying to login.');
                // Try to login one time assuming the access_token has expired since the last request
                if (await this._login()) return this.setDeviceOutput(device, state);
                else {
                    console.error(err.error)
                    return false;
                }
            }else {
                console.error(`Could not set Unifi LED device ${device} state to ${state ? 'on' : 'off'}`);
                return false;
            }
        })
    }

    /**
     * Sets the on/off state for a group
     * @param {string} group - The id of the group to set. id values can be retrieved from getGroups()[i].id
     * @param {boolean} state - true to turn the group on, false for off
     * @returns {boolean}
     */
    setGroupOutput(group, state) {
        if (this._debug) console.log(`Attempting to set Unifi LED group ${group} state to ${state ? 'on' : 'off'}`)

        const requestOutput = state ? 1 : 0;
        const options = {
            url: this.baseUrl + `/v1/group/${group}`,
            method: 'PUT',
            httpsAgent: this._agent,
            headers: this._headers,
            data: {
                command: 'config-output',
                value: requestOutput
            }
        }

        return axios(options)
        .then(res => {
            return res.data.result == 'success'
        })
        .catch(async (err) => {
            if (err.response.status == 403) {
                console.error('403 Unauthorized access. Trying to login.');
                // Try to login one time assuming the access_token has expired since the last request
                if (await this._login()) return this.setGroupOutput(group, state);
                else {
                    console.error(err.error)
                    return false;
                }
            } else {
                console.error(`Could not set Unifi LED group ${group} state to ${state ? 'on' : 'off'}`)
                return false;
            }
        })
    }

    /**
     * Sets the brightness of a device
     * @param {string} device - The id of the device to modify. id values can be retrieved from getDevices()[i].id or getGroups().devices[i].id
     * @param {Number} brightness - The brightness of the device, in the range [0,100]
     * @returns {boolean}
     */
    setDeviceBrightness(device, brightness) {
        if (this._debug) console.log(`Attempting to set Unifi LED device ${device} brightness to ${brightness}`)

        const options = {
            url: this.baseUrl + `/v1/devices/${device}`,
            method: 'PUT',
            httpsAgent: this._agent,
            headers: this._headers,
            data: {
                command: 'sync',
                value: brightness
            }
        }

        return axios(options)
        .then(res => {
            return res.data['DeviceStatus.led'] == brightness;
        })
        .catch(async (err) => {
            if (err.response.status == 403) {
                console.error('403 Unauthorized access. Trying to login.');
                // Try to login one time assuming the access_token has expired since the last request
                if (await this._login()) return this.setDeviceBrightness(device, brightness);
                else {
                    console.error(err.error)
                    return false;
                }
            } else {
                console.error(`Could not set Unifi LED device ${device} brightness to ${brightness}`);
                return false;
            }
        })
    }

    /**
     * A convenience function that's a wrapper around setDeviceBrightness() for setting all of the devices in a group to one brightness.
     * This can be very noisy if modifying a large group and this._debug is set to true
     * @param {string} group - The group to modify. This should be an a member of the array returned by getGroups()
     * @param {Number} brightness - The brightness of the group, in the range [0,100]
     * @returns {boolean}
     */
    setGroupBrightness(group, brightness) {
        if (this._debug) console.log(`Attempting to set Unifi LED group ${group.name} brightness to ${brightness}`)
        let groupRet = true;

        group.devices.forEach(device => {
            let deviceRet = this.setDeviceBrightness(device.id, brightness)
            if (!deviceRet) groupRet = deviceRet; // This will cause groupRet to be false if deviceRet is ever false
        })
        return groupRet
    }
}

module.exports = UnifiLED;