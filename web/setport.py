import meraki
import pprint
import json
import re
import sqlite3
import sys
from base64 import b64decode
from nacl.secret import SecretBox
import requests

pp = pprint.PrettyPrinter(indent=4)

sqlite_file = 'db/merakihooks.sqlite'    # name of the sqlite database file
portConnectChecks = []
#add to DB - or get via API
org_id = 816667

rule_matched = False

def getConfigTemplates():
    network_list = meraki.getnetworklist('57f2789ed5ca310b5a6e8771fea99e6e88e1e4fd', org_id)
    config_templates = {}
    for network in network_list:
        config_templates[network['configTemplateId']] = network['id']
    return config_templates


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
    systemnames = list()
    logMessage("Getting " + check_type + " Info")
    lldpcdpinfo = meraki.getlldpcdp(apikey, networkId, deviceSerial, '120', True)
    portnum = str(portnum)
    if lldpcdpinfo:
        if portnum in lldpcdpinfo['ports']:
            if check_type in lldpcdpinfo['ports'][portnum]:
                if 'systemName' in lldpcdpinfo['ports'][portnum][check_type]:
                    systemnames.append(lldpcdpinfo['ports'][portnum][check_type]['systemName'])
                    logMessage("Found SystemName: " + lldpcdpinfo['ports'][portnum][check_type]['systemName'])
                if 'deviceId' in lldpcdpinfo['ports'][portnum][check_type]:
                    systemnames.append(lldpcdpinfo['ports'][portnum][check_type]['deviceId'])
                    logMessage("Found deviceId: " + lldpcdpinfo['ports'][portnum][check_type]['deviceId'])
                return systemnames
    return None

    


def logMessage(message):
    print(message)


def getMacAddresses(apikey, serialnum, portnum):
    macs = list()
    dhcphostnames = list()
    logMessage("Getting Mac address Info")
    getclients = meraki.getclients(apikey, serialnum, '100', True)
    if getclients:
        for client in getclients:
            if int(client['switchport']) == int(portnum):
                macs.append(client['mac'])
                dhcphostnames.append(client['dhcpHostname'])
        return macs, dhcphostnames
    return None


def regexCheck(regstring, checkstring):
    if isinstance(checkstring, list):
        for item in checkstring:
            m = re.match(regstring, item)
            if m:
                return True
    if isinstance(checkstring, unicode) or isinstance(checkstring, str):
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
    global rule_matched
    rule_matched = True
    portprofile = getPortProfile(portprofilename)
    if portprofile['allowedvlans'] == '':
        portprofile['allowedvlans'] = 'all'
    try:
        logMessage("Attempting to set port info: " + str(serialnum) + ", " + str(devicename) + ", " + str(portnum) + ", " + str(portprofilename))
        print(portprofile)
        result = meraki.updateswitchport(apikey, serialnum, portnum, portprofile['name'], portprofile['tags'], portprofile['enabled'], portprofile['porttype'], portprofile['vlan'], portprofile['voicevlan'], portprofile['allowedvlans'], portprofile['poe'], portprofile['isolation'], portprofile['rstp'], portprofile['stpguard'], portprofile['accesspolicynum'], False)
        print(result)
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
        logMessage("Sending Slack Webhook")
        req = requests.post(SLACK_ALERT_WEBHOOK,
                            data=json_data.encode('ascii'),
                            headers={'Content-Type': 'application/json'})
        if req.text == 'ok' and req.status_code == 200:
            print('Successfully posted message to slack - SC: ' + str(req.status_code) + ' Text: ' + req.text)
            return
    except Exception as e:
        print("EXCEPTION: " + str(e))

def convertListToString(listname):
    returnstring = ''
    for item in listname:
        returnstring = returnstring + " `" + str(item) + "` "
    return returnstring


def main():
    if (len(sys.argv) != 2):
        logMessage("Error: Invalid number of arguments recieved - " + str(sys.argv))
        sys.exit()

    webhook_data = getWebhookData(sys.argv[1])

    logMessage("Webhook Recieved: " + str(webhook_data))

    apikey = getAPIKey(webhook_data['sharedSecret'])
    getPortConnectChecks()
    config_templates = getConfigTemplates()

    del webhook_data['sharedSecret']

    if webhook_data['alertType'] == "Switch port connected":
        devicename = webhook_data['deviceName']
        serialnum = webhook_data['deviceSerial']
        networkid = webhook_data['networkId']
        portnum = webhook_data['alertData']['portNum']

        if networkid in config_templates:
            networkid = config_templates[networkid]

        lldpsystemnames = getSystemName(apikey, 'lldp', networkid, serialnum, portnum)
        cdpsystemnames = getSystemName(apikey, 'cdp', networkid, serialnum, portnum)
        macs, dhcphostnames = getMacAddresses(apikey, serialnum, portnum)

        for check in portConnectChecks:
            # print(check)
            if check['checktype'] == 'lldp' and regexCheck(check['regstring'], lldpsystemnames):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break
            elif check['checktype'] == 'cdp' and regexCheck(check['regstring'], cdpsystemnames):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break
            elif check['checktype'] == 'mac' and regexCheck(check['regstring'], macs):
                print("Setting port profile to " + check['portprofile'])
                setPortProfile(apikey, serialnum, devicename, portnum, check['portprofile'])
                break
        if not rule_matched:
            alertstring = "Received alert for " +  devicename + " port " + str(portnum) + " with mac addresses " + convertListToString(macs) + " and dhcp hostname " + convertListToString(dhcphostnames)  
            if cdpsystemnames:
                alertstring += " and cdp hostname " + convertListToString(cdpsystemnames) +". There is no rule configured for this device."
            if lldpsystemnames:
                alertstring += " and lldp hostname " + convertListToString(lldpsystemnames) +". There is no rule configured for this device."
            send_alert(alertstring)
            #send_alert("Received alert for " +  devicename + " port " + str(portnum) + " with dhcp hostname " + str(dhcphostnames) + ". There is no rule configured for this device.")
    else:
        logMessage('No action available for alert type "' + webhook_data['alertType'] + '"')


if __name__ == "__main__":
    main()
