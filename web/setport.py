import meraki
import pprint
import json
import re
import sqlite3
import sys
from base64 import b64decode
from nacl.secret import SecretBox
import requests

sqlite_file = 'db/merakihooks.sqlite'    # name of the sqlite database file
portConnectChecks = []


def getPortConnectChecks():
    conn = sqlite3.connect(sqlite_file)
    c = conn.cursor()
    c.execute('select checktype, regstring, portprofile from portconnectchecks;')
    all_rows = c.fetchall()
    for item in all_rows:
        row = {}
        row['checktype'] = item[0]
        row['regstring'] = item[1]
        row['portprofile'] = item[2]
        portConnectChecks.append(row)
    conn.commit()
    conn.close()


def getPortProfile(profile):
    portprofile = {}
    conn = sqlite3.connect(sqlite_file)
    c = conn.cursor()
    c.execute('select name, tags, enabled, poe, porttype, vlan, voicevlan, isolation, rstp, stpguard, accesspolicynum, allowedvlans from portprofiles where name = ?;', (profile,))
    all_rows = c.fetchall()
    for item in all_rows:
        portprofile['name'] = item[0]
        portprofile['tags'] = item[1]
        portprofile['tags'] = [i for i in portprofile['tags'].split()]
        portprofile['enabled'] = bool(item[2])
        portprofile['poe'] = bool(item[3])
        portprofile['porttype'] = item[4]
        portprofile['vlan'] = item[5]
        portprofile['voicevlan'] = item[6]
        portprofile['isolation'] = bool(item[7])
        portprofile['rstp'] = bool(item[8])
        portprofile['stpguard'] = item[9]
        portprofile['accesspolicynum'] = item[10]
        portprofile['allowedvlans'] = item[11]
        return portprofile
    conn.commit()
    conn.close()


def getSystemName(apikey, check_type, networkId, deviceSerial, portnum):
    lldpcdpinfo = meraki.getlldpcdp(apikey, networkId, deviceSerial, '120', True)
    portnum = str(portnum)
    if lldpcdpinfo:
        if portnum in lldpcdpinfo['ports']:
            if 'systemName' in lldpcdpinfo['ports'][portnum][check_type]:
                systemname = lldpcdpinfo['ports'][portnum][check_type]['systemName']
                return systemname
    return None

def logMessage(message):
    print(message)


def getMacAddresses(apikey, serialnum, portnum):
    macs = list()
    getclients = meraki.getclients(apikey, serialnum, '100', True)
    if getclients:
        for client in getclients:
            if int(client['switchport']) == int(portnum):
                macs.append(client['mac'])
        return macs
    return None


def regexCheck(regstring, checkstring):
    if isinstance(checkstring, list):
        for item in checkstring:
            m = re.match(regstring, item)
            if m:
                return True
    if isinstance(checkstring, unicode):
        m = re.match(regstring, checkstring)
        if m:
            return True
    return False


def open_json_file(file_name):
    f = open(file_name, 'r')
    json_file = f.read()
    f.close()
    return json.loads(json_file)


def setPortProfile(apikey, serialnum, devicename, portnum, portprofilename):
    portprofile = getPortProfile(portprofilename)
    try:
        result = meraki.updateswitchport(apikey, serialnum, portnum, portprofile['name'], portprofile['tags'], portprofile['enabled'], portprofile['porttype'], portprofile['vlan'], portprofile['voicevlan'], portprofile['allowedvlans'], portprofile['poe'], portprofile['isolation'], portprofile['rstp'], portprofile['stpguard'], portprofile['accesspolicynum'], False)
        send_alert("Switch " + str(devicename) + " port " + str(portnum) + " configured with port profile " + str(portprofile['name']))

    except Exception as e:
        logMessage("Error Setting port information: " + str(e))


def getAPIKey(secret):
    try:
        secret_key = secret.ljust(32, ".")
        conn = sqlite3.connect(sqlite_file)
        c = conn.cursor()
        c.execute('select apikey from settings;')
        encrypted_apikey = c.fetchall()[0][0]
        conn.commit()
        conn.close()

        encrypted_apikey = encrypted_apikey.split(':')
        # We decode the two bits independently
        nonce = b64decode(encrypted_apikey[0])
        encrypted = b64decode(encrypted_apikey[1])
        # We create a SecretBox, making sure that out secret_key is in bytes
        box = SecretBox(bytes(secret_key))
        return box.decrypt(encrypted, nonce).decode('utf-8')
    except Exception as e:
        logMessage("Error decrypting API key - " + str(e))


def getWebhookData(filename):
    try:
        with open('/tmp/' + filename) as webhook:
            webhook_file_data = webhook.read()
            webhook_data = json.loads(webhook_file_data)
    except Exception as e:
        logMessage("Error accessing webhook data - " + str(e))
        sys.exit()
    return webhook_data

def send_alert(message):
    SLACK_ALERT_WEBHOOK = 'https://hooks.slack.com/services/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'
    post = {"text": "{0}".format(message)}
    try:
        json_data = json.dumps(post)
        req = requests.post(SLACK_ALERT_WEBHOOK,
                            data=json_data.encode('ascii'),
                            headers={'Content-Type': 'application/json'})
        if req.text == 'ok' and req.status_code == 200:
            print('Successfully posted message to slack - SC: ' + str(req.status_code) + ' Text: ' + req.text)
            return
    except Exception as e:
        print("EXCEPTION: " + str(e))


def main():
    if (len(sys.argv) != 2):
        logMessage("Error: Invalid number of arguments recieved - " + str(sys.argv))
        sys.exit()

    webhook_data = getWebhookData(sys.argv[1])

    logMessage("Webhook Recieved: " + str(webhook_data))

    apikey = getAPIKey(webhook_data['sharedSecret'])
    getPortConnectChecks()

    del webhook_data['sharedSecret']

    if webhook_data['alertType'] == "Switch port connected":
        devicename = webhook_data['deviceName']
        serialnum = webhook_data['deviceSerial']
        networkid = webhook_data['networkId']
        portnum = webhook_data['alertData']['portNum']

        lldpsystemname = getSystemName(apikey, 'lldp', networkid, serialnum, portnum)
        cdpsystemname = getSystemName(apikey, 'cdp', networkid, serialnum, portnum)
        macs = getMacAddresses(apikey, serialnum, portnum)

        for check in portConnectChecks:
            # print(check)
            if check['checktype'] == 'lldp' and regexCheck(check['regstring'], lldpsystemname):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break
            if check['checktype'] == 'cdp' and regexCheck(check['regstring'], cdpsystemname):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break
            if check['checktype'] == 'mac' and regexCheck(check['regstring'], macs):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break

    else:
        logMessage('No action available for alert type"' + webhook_data['alertType'] + '"')


if __name__ == "__main__":
    main()
