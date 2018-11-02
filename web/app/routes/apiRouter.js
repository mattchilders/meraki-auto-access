const router = require('express').Router();
const sqlite3 = require('sqlite3')

//var mysql = require("mysql");
//var bCrypt  = require('bcrypt-nodejs');
//var sizeOf = require('image-size');
var fs = require('fs');
var request = require('request');
//var md5 = require('MD5');
//var email = require('../lib/emailHelpers.js');
//var config = require('../config/config.json')
var path = require('path');
//var jwt = require('jsonwebtoken');
//var jwt_key = config[config.current_env].jwt_key;


/*var node_env = config.current_env;
var connection = mysql.createPool({
    connectionLimit : 100,
    host     : config[node_env].host,
    user     : config[node_env].username,
    password : config[node_env].password,
    database : config[node_env].database,
    debug    :  false
});*/

//console.log(connection);
let db = new sqlite3.Database('./db/merakihooks.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
}); 

 
// close the database connection


//var awsIot = require('aws-iot-device-sdk');
//var PythonShell = require('python-shell');
//var randomstring = require("randomstring");
//var md5File = require('md5-file');

/*var device = awsIot.device({
   keyPath: config[node_env].keyPath,
  certPath: config[node_env].certPath,
    caPath: config[node_env].caPath,
  clientId: 'restapi' + randomstring.generate(),
      host: config[node_env].iot_host
});*/


/***********************/
/*  /api/portprofiles  */
/***********************/
router.get("/api/portprofiles",function(req,res){
    console.log('here');
    var query = "SELECT * FROM portprofiles;";
    db.all(query, [], (err, rows) => {
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/controllers/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/controllers",function(req,res){
    var query = "SELECT c.*, s.site_name FROM controllers c inner join sites s on c.site_id = s.site_id;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/controllers/:controllerid",function(req,res){
    var query = "SELECT c.*, s.site_name FROM controllers c inner join sites s on c.site_id = s.site_id where controller_id = ?;";
    var table = [req.params.controllerid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/controllers', function (req, res) {
    var params  = req.body;
    var siteid = [params.site_id]
    var query = "select * FROM sites where site_id = ?;";
    query = mysql.format(query,siteid);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "Site ID does not exist.  Please create the site before creating the device"});
            } else {
                var query = "INSERT INTO retikulate.controllers (controller_id, site_id, device_type, matrix_model, audio_device_type, num_inputs, hdmi_group, hdmi_mode, hdmi_delay, ssh_port, audio_format, reset_flag, provision_status) VALUES (?);";
                var values = [];
                values.push(params['controller_id']);
                values.push(params['site_id']);
                values.push(1);
                values.push(params['matrix_model']);
                values.push(params['audio_device_type']);
                values.push(params['num_inputs']);
                values.push(params['hdmi_group']);
                values.push(params['hdmi_mode']);
                values.push(params['hdmi_delay']);
                values.push(params['ssh_port']);
                values.push(params['audio_format']);
                values.push(params['reset_flag']);
                values.push(params['provision_status']);
                connection.query(query, [values], function(err,rows){
                    if(err) {
                        res.json({"Error" : true, "Message" : err});
                    } else {
                        console.log(params.num_inputs)
                        var num_inputs = parseInt(params.num_inputs)
                        for (i = 1; i < num_inputs+1; i++) { 
                            console.log(i)
                            // CHANGE-SITEID
                            //var query = "INSERT INTO retikulate.devices (device_id, site_id, device_type, controller_id) VALUES (?);";
                            var query = "INSERT INTO retikulate.devices (device_id, controller_id) VALUES (?);";
                            var values = [];
                            values.push(params['controller_id'] + i)
                            //values.push(params['site_id'])
                            values.push(params['controller_id'])
                            connection.query(query, [values], function(err,rows){
                                if(err) {
                                    res.json({"Error" : true, "Message" : err});
                                } 
                            });
                        }
                        res.json({"Error" : false, "Message" : "Success", "data" : rows});
                    }
                });
            }
        }
    });
});

router.put('/api/controllers/:controllerid', function (req, res) {
    var params  = req.body;
    var controllerid = [req.params.controllerid]
    var query = "select * FROM controllers where controller_id = ?;";
    query = mysql.format(query,controllerid);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "Controller ID does not exist."});
            } else {
                var orig_num_inputs = parseInt(rows[0].num_inputs)
                var query = "update retikulate.controllers set site_id = ?, device_type = ? , matrix_model = ?, audio_device_type = ?, num_inputs = ?, hdmi_group = ?, hdmi_mode = ?, hdmi_delay = ?, ssh_port = ?, audio_format = ?, provision_status = ?, reset_flag = ? where controller_id = ?;";
                var values = [];
                values.push(params['site_id']);
                values.push(params[1]);
                values.push(params['matrix_model']);
                values.push(params['audio_device_type']);
                values.push(params['num_inputs']);
                values.push(params['hdmi_group']);
                values.push(params['hdmi_mode']);
                values.push(params['hdmi_delay']);
                values.push(params['ssh_port']);
                values.push(params['audio_format']);
                values.push(params['provision_status']);
                values.push(params['reset_flag']);
                values.push(controllerid);
                query = mysql.format(query, values);

                connection.query(query, [values], function(err,rows){
                    if(err) {
                        res.json({"Error" : true, "Message" : err});
                    } else {
                        var num_inputs = parseInt(params.num_inputs)
                        if (num_inputs != orig_num_inputs){
                            var query = "DELETE FROM devices WHERE controller_id= ?;";
                            var values = [controllerid];
                            query = mysql.format(query,values);
                            connection.query(query,function(err,rows){
                                if(err) {
                                    res.json({"Error" : true, "Message" : "Error executing MySQL query"});
                                } else {
                                    for (i = 1; i < num_inputs+1; i++) { 
                                        var query = "INSERT INTO retikulate.devices (device_id, controller_id) VALUES (?);";
                                        var values = [];
                                        values.push(params['controller_id'] + i)
                                        values.push(params['controller_id'])
                                        connection.query(query, [values], function(err,rows){
                                            if(err) {
                                                res.json({"Error" : true, "Message" : err});
                                            } 
                                        });
                                    }
                                    res.json({"Error" : false, "Message" : "Success", "data" : rows});
                                }
                            });
                        }
                        else {
                            res.json({"Error" : false, "Message" : "Success", "data" : rows});
                        }
                    }
                });
            }
        }
    });
});

router.delete('/api/controllers/:controllerid', function (req, res) {
    var query = "DELETE FROM controllers WHERE controller_id= ?;";
    var table = [req.params.controllerid];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/controllers/command', function (req, res) {
    var params  = req.body;
    //console.log(params['channel']);
    device.publish('control/' + params['controller_id'], '{"command": "' + params['command'] + '"}', function(err) {
        if (err) {
            res.json({"Error" : true, "Message" : "Error"});
        } else {
            res.json({"Error" : false, "Message" : "Success"});
        }
    });
});

router.post('/api/controllers/provision/:controllerid', function (req, res) {
    var params  = req.body;
    var controllerid = [req.params.controllerid]
    var query = "select * FROM controllers where controller_id = ?;";
    query = mysql.format(query,controllerid);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "Controller ID does not exist."});
            } else {
                res.json({"Error" : false, "Message" : "Provisioning started"});
                var options = {
                  mode: 'text',
                  pythonPath: '/usr/bin/python',
                  pythonOptions: ['-u'],
                  scriptPath: '/opt/retikulate_dashboard',
                  args: [controllerid]
                };
                
                PythonShell.run('ctrl_provision.py', options, function (err, results) {
                    if (err){
                        console.log(err)
                    }
                });
            }
        }
    });
});

//////////////////////////////////////////////////////////////////////////////
// api/devices/
//////////////////////////////////////////////////////////////////////////////
// CHANGE-SITEIDx
router.get("/api/devices",function(req,res){
    //var query = "SELECT devices.device_id, devices.device_name as device_name, devices.site_id, sites.site_name, devices.device_type, device_types.device_name as device_type_name FROM devices inner join sites on sites.site_id = devices.site_id inner join device_types on devices.device_type = device_types.device_type;";
    var query = "SELECT c.controller_id, d.device_id, d.device_name, c.site_id, s.site_name, c.device_type, dt.device_name as device_type_name FROM devices d inner join controllers c on d.controller_id = c.controller_id inner join sites s on s.site_id = c.site_id inner join device_types dt on c.device_type = dt.device_type;";
    var table = [req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/devices/:deviceid",function(req,res){
    //var query = "SELECT devices.device_id, devices.site_id, sites.site_name, devices.device_type, device_types.device_name FROM devices inner join sites on sites.site_id = devices.site_id inner join device_types on devices.device_type = device_types.device_type where devices.device_id = ?;";
    var query = "SELECT d.device_id, d.device_name, c.controller_id, c.site_id, s.site_name, c.device_type, dt.device_name as device_type_name FROM devices d inner join controllers c on d.controller_id = c.controller_id inner join sites s on s.site_id = c.site_id inner join device_types dt on c.device_type = dt.device_type where d.device_id = ?;";
    var table = [req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/devices/site/:deviceid",function(req,res){
    //var query = "select s.site_name, s.address1, s.city, s.state, s.zip from devices d, sites s where s.site_id = d.site_id AND d.device_id = ?;";
    var query = "select s.site_name, s.address1, s.city, s.state, s.zip from devices d inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where d.device_id = ?;";
    var table = [req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/devices/ads/:deviceid/:seconds",function(req,res){
    //var query = "select ad_log.timestamp, ad_log.device_id, ads.descrip from ad_log inner join ads on ad_log.ad_id = ads.ad_id where ad_log.device_id = ? and time_to_sec(timediff(now(), ad_log.timestamp)) < ? order by ad_log.timestamp desc;";
    var query = "select al.timestamp, al.device_id, al.site_id, a.descrip from ad_log al inner join ads a on al.ad_id = a.ad_id where al.device_id = ? and time_to_sec(timediff(now(), al.timestamp)) < ? order by al.timestamp desc;";
    var table = [req.params.deviceid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


//////////////////////////////////////////////////////////////////////////////
// api/bms/
//////////////////////////////////////////////////////////////////////////////

router.get("/api/bm_config",function(req,res){
    var query = "SELECT c.name as channel, b.channel_id, b.script, s.site_name, b.serial, b.device_id, b.video, b.audio, b.pause, b.type FROM bm_config b inner join channels c on c.chan_id = b.channel_id inner join devices d on d.device_id = b.device_id inner join controllers co on co.controller_id = d.controller_id inner join sites s on s.site_id = co.site_id;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/bm_config/available_devices",function(req,res){
    var query = "select d.device_id from devices d inner join controllers c on c.controller_id = d.controller_id inner join device_types dt on c.device_type = dt.device_type where dt.device_type = 2 or dt.device_type = 4;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/bm_config/:controllerid",function(req,res){
    var query = "SELECT c.name as channel, b.script, b.serial, b.device_id, b.video, b.audio, b.pause, b.type FROM bm_config b inner join channels c on c.chan_id = b.channel_id inner join devices d on d.device_id = b.device_id where d.controller_id = ?;";
    var table = [req.params.controllerid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/bm_config', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO bm_config (device_id, channel_id, script, serial, video, audio, pause, type) VALUES (?);";
    var values = [];
    values.push(params['device_id']);
    values.push(params['channel_id']);
    values.push(params['script']);
    values.push(params['serial']);
    values.push(params['video']);
    values.push(params['audio']);
    values.push(params['pause']);
    values.push(params['type']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/bm_config/:deviceid', function (req, res) {
    var params  = req.body;
    var query = "update bm_config SET channel_id = ?, script = ?, serial = ?, video = ?, audio = ?, pause = ?, type = ? where device_id = ?;";
    var values = [];
    values.push(params['channel_id']);
    values.push(params['script']);
    values.push(params['serial']);
    values.push(params['video']);
    values.push(params['audio']);
    values.push(params['pause']);
    values.push(params['type']);
    values.push(req.params.deviceid);
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/bm_config/:deviceid', function (req, res) {
    var query = "delete from bm_config where device_id = ?";
    var table = [req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/sites/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/sites",function(req,res){
    var query = "select s.site_id, s.site_name, s.address1, s.address2, s.city, s.state, s.zip, s.phone, s.notes, s.contact_id, s.timezone, s.status, s.wifi_ssid, s.wifi_pass, s.wifi_encryption, s.monthly_visitors, s.testdev from sites s;";
    var table = [];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {

            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/sites', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO retikulate.sites (site_name, address1, address2, city, state, zip, phone, notes, timezone, status, wifi_ssid, wifi_pass, wifi_encryption, monthly_visitors) VALUES (?);";
    var values = [];
    values.push(params['site_name']);
    values.push(params['address1']);
    values.push(params['address2']);
    values.push(params['city']);
    values.push(params['state']);
    values.push(params['zip']);
    values.push(params['phone']);
    values.push(params['notes']);
    values.push(params['timezone']);
    values.push(params['status']);
    values.push(params['wifi_ssid']);
    values.push(params['wifi_pass']);
    values.push(params['wifi_encryption']);
    values.push(params['monthly_visitors']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/sites/devices/:siteid",function(req,res){
    //var query = "SELECT devices.device_id, devices.site_id, sites.site_name, devices.device_type, device_types.device_name FROM devices inner join sites on sites.site_id = devices.site_id inner join device_types on devices.device_type = device_types.device_type where sites.site_id = ?;";
    var query = "SELECT d.device_id, s.site_id, s.site_name, c.device_type, dt.device_name FROM devices d inner join controllers c on d.controller_id = c.controller_id inner join sites s on s.site_id = c.site_id inner join device_types dt on c.device_type = dt.device_type where s.site_id = ?;";
    var table = [req.params.siteid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/sites/dashboard/summary",function(req,res){
    var query = "select s.site_id, s.site_name, count(distinct c.controller_id) as controller_count, count(distinct d.device_id) as device_count, count(case when al.timestamp > (now() - INTERVAL 1 hour) then 1 else null end)/count(distinct(al.ad_id)) as commhr1, count(al.ad_id)/count(distinct(al.ad_id)) as commhr4 from controllers c inner join sites s on s.site_id = c.site_id and c.num_inputs > 0 inner join devices d on c.controller_id = d.controller_id left join ad_log al on d.device_id = al.device_id and al.timestamp > (now() - INTERVAL 4 hour) group by s.site_id;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/sites/operating_hours/:siteid",function(req,res){
    var query = "select oh.day_of_week, oh.start_time, oh.end_time from operating_hours oh inner join sites s on oh.site_id = s.site_id where s.site_id = ?;";
    var table = [req.params.siteid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/operating_hours/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/operating_hours",function(req,res){
    var query = "select oh.site_id, oh.day_of_week, oh.start_time, oh.end_time from operating_hours oh inner join sites s on oh.site_id = s.site_id;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/operators/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/operators",function(req,res){
    var query = "select o.operator_id, o.firstname, o.lastname, o.address1, o.address2, o.city, o.state, o.zip, o.phone, o.notes from operators o;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {

            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/customers/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/customers",function(req,res){
    var query = "select cust_id, name, address1, address2, city, state, zip, phone, notes, subscrip_cust_id from customers;";
    var table = []
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {

            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/customers/:custid/email",function(req,res){
    var query = "select email from users where cust_id = ?;";
    var table = [req.params.custid];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {

            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/customers', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO retikulate.customers (name, address1, address2, city, state, zip, phone, notes) VALUES (?);";
    var values = [];
    values.push(params['name']);
    values.push(params['address1']);
    values.push(params['address2']);
    values.push(params['city']);
    values.push(params['state']);
    values.push(params['zip']);
    values.push(params['phone']);
    values.push(params['notes']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get('/api/customers/campaigns/approvals', function (req, res) {
    var query = "select c.order_id, c.cust_id, c.change_req_date, c.change_type, c.approval_status, c.payment_status, c.campaign_id, c.campaign_name, c.ad_id, a.descrip, c.start_date, c.end_date, c.site_id, s.site_name, c.notes, c.length, c.cpm_usd_cost, c.length_mons, c.monthly_usd_cost, c.ad_order, c.payment_status, c.site_visitors from campaigns_approvals c left join ads a on c.ad_id = a.ad_id left join sites s on c.site_id = s.site_id order by site_id, ad_order;";
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.post('/api/customers/campaigns/approvals', function (req, res) {
    var params  = req.body;
    var query = "insert into campaigns_approvals (change_req_date, change_type, approval_status, approval_notes, approval_id, campaign_id, c.campaign_name, ad_id, start_date, end_date, site_id, notes, length, cpm_usd_cost, site_visitors, length_mons, monthly_usd_cost, ad_order, payment_status, cust_id) values (NOW(), ?);";
    var values = [];
    values.push(params['change_type']);
    values.push(params['approval_status']);
    values.push(params['approval_notes']);
    values.push(params['approval_id']);
    values.push(params['campaign_id']);
    values.push(params['campaign_name']);
    values.push(params['ad_id']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(params['site_id']);
    values.push(params['notes']);
    values.push(params['length']);
    values.push(params['cpm_usd_cost']);
    values.push(params['site_visitors']);
    values.push(params['length_mons']);
    values.push(params['monthly_usd_cost']);
    values.push(params['ad_order']);
    values.push(params['payment_status']);
    values.push(params['cust_id']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/customers/campaigns/approvals/:order_id', function (req, res) {
    var params  = req.body;
    var query = "update campaigns_approvals SET change_type = ?, approval_status = ?, approval_notes = ?, approval_id = ?, campaign_id = ?, campaign_name = ?, ad_id = ?, start_date = ?, end_date = ?, site_id = ?, notes = ?, length = ?, cpm_usd_cost = ?, site_visitors = ?, length_mons = ?, monthly_usd_cost = ?, ad_order = ?, payment_status = ?, cust_id = ? where order_id = ?;";
    var values = [];
    values.push(params['change_type']);
    values.push(params['approval_status']);
    values.push(params['approval_notes']);
    values.push(params['approval_id']);
    values.push(params['campaign_id']);
    values.push(params['campaign_name']);
    values.push(params['ad_id']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(params['site_id']);
    values.push(params['notes']);
    values.push(params['length']);
    values.push(params['cpm_usd_cost']);
    values.push(params['site_visitors']);
    values.push(params['length_mons']);
    values.push(params['monthly_usd_cost']);
    values.push(params['ad_order']);
    values.push(params['payment_status']);
    values.push(params['cust_id']);
    values.push(req.params.order_id);
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.delete('/api/customers/campaigns/approvals/:order_id', function (req, res) {
    var query = "delete from campaigns_approvals where order_id = ?";
    var table = [req.params.order_id];
    query = mysql.format(query,table);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/log/device
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/log/device/:hours",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl WHERE log_type <> 'KEEPALIVE' AND log_type <> 'CONFIG' and log_type <> 'ERROR' and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/device/:device_id/:hours",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl where device_id = ? and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.device_id, parseInt(req.params.hours)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/device/channel/:device_id/:hours",function(req,res){
    var query = "select timestamp, device_id, channel_id, status from channel_status_log dl where device_id = ? and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.device_id, parseInt(req.params.hours)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/device/:device_id/range/:start/:end",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl where device_id = ? and UNIX_TIMESTAMP(timestamp) > ? and UNIX_TIMESTAMP(timestamp) < ? order by dl.timestamp desc;";
    var table = [req.params.device_id, parseInt(req.params.start), parseInt(req.params.end)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/device/site/:siteid/:hours",function(req,res){
    var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on dl.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id where c.site_id = ? and dl.timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.siteid, parseInt(req.params.hours)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/device/site/:siteid/range/:start/:end",function(req,res){
    var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on dl.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id where c.site_id = ? and UNIX_TIMESTAMP(dl.timestamp) > ? and UNIX_TIMESTAMP(dl.timestamp) < ? order by timestamp desc;";
    var table = [req.params.siteid, req.params.start, req.params.end];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/log/controller
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/log/controller/:hours",function(req,res){
    var query = "select timestamp, controller_id, log_type, message from controller_log dl WHERE log_type <> 'KEEPALIVE' AND log_type <> 'CONFIG' and log_type <> 'ERROR' and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/controller/:controller_id/:hours",function(req,res){
    var query = "select timestamp, controller_id, log_type, message from controller_log dl where controller_id = ? and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.controller_id, parseInt(req.params.hours)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/controller/:controller_id/range/:start/:end",function(req,res){
    var query = "select timestamp, controller_id, log_type, message from controller_log dl where controller_id = ? and UNIX_TIMESTAMP(timestamp) > ? and UNIX_TIMESTAMP(timestamp) < ? order by dl.timestamp desc;";
    var table = [req.params.controller_id, parseInt(req.params.start), parseInt(req.params.end)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/controller/site/:siteid/:hours",function(req,res){
    var query = "select cl.timestamp, cl.controller_id, cl.log_type, cl.message from controller_log cl inner join controllers c on cl.controller_id = c.controller_id where c.site_id = ? and cl.timestamp > (now() - INTERVAL ? hour) order by cl.timestamp desc;";
    var table = [req.params.siteid, parseInt(req.params.hours)];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/log/controller/site/:siteid/range/:start/:end",function(req,res){
    var query = "select cl.timestamp, cl.device_id, cl.log_type, cl.message from controller_log cl inner join controllers c on cl.controller_id = c.controller_id where c.site_id = ? and UNIX_TIMESTAMP(cl.timestamp) > ? and UNIX_TIMESTAMP(cl.timestamp) < ? order by cl.timestamp desc;";
    var table = [req.params.siteid, req.params.start, req.params.end];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});
















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/health/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/health/controller/summary",function(req,res){
    //var query = "select d.device_id, s.site_name, abs(max(TIMESTAMPDIFF(SECOND, NOW(), dl.timestamp))) as last_keepalive from devices d INNER JOIN device_log dl on d.device_id = dl.device_id INNER JOIN sites s on d.site_id = s.site_id where dl.log_type = 'KEEPALIVE' group by d.device_id order by last_keepalive desc;";
    //var query = "select h.controller_id, s.site_name, s.site_id, s.abbreviation, s.status, abs(max(TIMESTAMPDIFF(SECOND, NOW(), h.timestamp))) as last_keepalive from controller_health_log h RIGHT JOIN controllers c on h.controller_id = c.controller_id INNER JOIN sites s on s.site_id = c.site_id group by h.controller_id order by last_keepalive desc;";
    var query = "select c.controller_id, s.site_name, s.site_id, s.abbreviation, s.status, coalesce(abs(max(TIMESTAMPDIFF(SECOND, NOW(), h.timestamp))),28800) as last_keepalive from (select * from controller_health_log where timestamp > (now() - INTERVAL 8 hour)) h RIGHT JOIN (select * from controllers where device_type = 1) c on h.controller_id = c.controller_id INNER JOIN sites s on s.site_id = c.site_id group by c.controller_id order by last_keepalive desc;";

    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/health/controller/summary/site/:siteid",function(req,res){
    //var query = "select d.device_id, s.site_name, abs(max(TIMESTAMPDIFF(SECOND, NOW(), dl.timestamp))) as last_keepalive from devices d INNER JOIN device_log dl on d.device_id = dl.device_id INNER JOIN sites s on d.site_id = s.site_id where dl.log_type = 'KEEPALIVE' group by d.device_id order by last_keepalive desc;";
    //var query = "select h.controller_id, s.site_name, abs(max(TIMESTAMPDIFF(SECOND, NOW(), h.timestamp))) as last_keepalive from controller_health_log h INNER JOIN controllers c on h.controller_id = c.controller_id INNER JOIN sites s on s.site_id = c.site_id where c.site_id = ? group by h.controller_id order by last_keepalive desc;";
    var query = "select h1.controller_id, s.site_id, s.site_name, abs(TIMESTAMPDIFF(SECOND, NOW(), h1.timestamp)) as last_keepalive, h1.wlan_quality_pct, h1.chanmon_up_mins, h1.admgr_up_mins, h1.inet_http_avg from controller_health_log h1 inner join (select max(id) as id from controller_health_log group by controller_id) h2 on h1.id = h2.id inner join controllers c on c.controller_id = h1.controller_id inner join sites s on c.site_id = s.site_id where c.site_id = ?;"
    var table = [req.params.siteid];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/health/:seconds",function(req,res){
    var query = "select h.timestamp, h.controller_id, h.wlan_quality_pct, h.wlan_quality_dbm, h.ap_mac, h.cpu_temp, h.cpu_usage, h.memory_usage, h.admgr_up_mins, h.chanmon_up_mins from controller_health_log as h where time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [req.params.seconds];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/health/controller/:controllerid/:seconds",function(req,res){
    var query = "select h.timestamp, h.controller_id, h.wlan_quality_pct, h.wlan_quality_dbm, h.ap_mac, h.cpu_temp, h.cpu_usage, h.memory_usage, h.admgr_up_mins, h.chanmon_up_mins, h.gw_ping_avg, h.inet_http_avg from controller_health_log h where h.controller_id = ? and time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [req.params.controllerid,req.params.seconds];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/health/site/:siteid/:seconds",function(req,res){
    var query = "select h.timestamp, h.controller_id, h.wlan_quality_pct, h.wlan_quality_dbm, h.ap_mac, h.cpu_temp, h.cpu_usage, h.memory_usage, h.admgr_up_mins, h.chanmon_up_mins, h.gw_ping_avg, h.inet_http_avg from controller_health_log h inner join controllers c on c.controller_id = h.controller_id where c.site_id = ? and time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [req.params.siteid,req.params.seconds];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/health/lastkeepalive/controller/:controller_id",function(req,res){
    var query = "select TIMESTAMPDIFF(SECOND, NOW(), timestamp) as last_keepalive from controller_health_log hl where controller_id = ? order by hl.timestamp asc limit 1;";
    var table = [req.params.controller_id];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/health/lastkeepalive/site/:site_id",function(req,res){
    var query = "select abs(max(TIMESTAMPDIFF(SECOND, NOW(), hl.timestamp))) as last_keepalive from controllers c INNER JOIN controller_health_log hl on c.controller_id = hl.controller_id INNER JOIN sites s on c.site_id = s.site_id where c.site_id = ? group by c.controller_id order by last_keepalive asc LIMIT 1;";
    var table = [req.params.site_id];
    query = mysql.format(query, table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/providers
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/providers",function(req,res){
    var query = "select provider_id, name from providers order by provider_id;";
    var table = [];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/providers', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO providers (provider_id, name) VALUES (?);";
    var values = [];
    values.push(params['provider_id']);
    values.push(params['name']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/providers/:provider_id', function (req, res) {
    var params  = req.body;
    var query = "update providers set provider_id = ?, name = ? where provider_id = ?;";
    var values = [];
    values.push(params['new_provider_id']);
    values.push(params['name']);
    values.push(req.params.provider_id);
    query = mysql.format(query, values);
    console.log(query);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/providers/:provider_id', function (req, res) {
    var query = "delete from providers WHERE provider_id = ?;";
    var table = [req.params.provider_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/providers/:provider_id/channel/:chan_id",function(req,res){
    var query = "select p.provider_id, p.chan_id, p.chan_num from provider_channels p where p.provider_id = ? and p.chan_id = ? order by provider_id;";
    var table = [req.params.provider_id, req.params.chan_id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/channels/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/channels",function(req,res){
    var query = "select chan_id, name from channels order by chan_id;";
    var table = [];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/channels', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO channels (chan_id, name) VALUES (?);";
    var values = [];
    values.push(params['chan_id']);
    values.push(params['name']);
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/channels/:chan_id', function (req, res) {
    var params  = req.body;
    var query = "update channels set chan_id = ?, name = ? where chan_id = ?;";
    var values = [];
    values.push(params['new_chan_id']);
    values.push(params['name']);
    values.push(req.params.chan_id);
    query = mysql.format(query, values);
    console.log(query);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/channels/:chan_id', function (req, res) {
    var query = "delete from channels WHERE chan_id = ?;";
    var table = [req.params.chan_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/channels/current",function(req,res){
    var query = "select c.name, csl.type from bm_config csl inner join channels c on csl.channel_id = c.chan_id;";
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.post('/api/channels/status/', function (req, res) {
    var params  = req.body;
    //console.log(params['channel']);
    device.publish('channels/' + params['channel'], '{"timestamp": "' + params['timestamp'] + '","status": ' + params['status'] + '}', function(err) {
        if (err) {
            res.json({"Error" : true, "Message" : "Error"});
        } else {
            res.json({"Error" : false, "Message" : "Success"});
        }
    });
});


router.get("/api/channels/status/:seconds",function(req,res){
    var query = "select csl.timestamp, csl.device_id, c.name, csl.channel_id, csl.status from channel_status_log csl inner join channels c on csl.channel_id = c.chan_id where time_to_sec(timediff(now(), csl.timestamp)) < ? order by csl.timestamp desc;";
    var table = [req.params.seconds];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channels/status/name/:channel_name/:seconds",function(req,res){
    var query = "select timestamp, status, device_id from channel_status_log csl inner join channels c on csl.channel_id = c.chan_id where c.name = ? and time_to_sec(timediff(now(), timestamp)) < ? order by csl.timestamp desc;";
    var table = [req.params.channel_name, req.params.seconds];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query", "Query" : query});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows}); 
        }
    });
});
























////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/errors/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/errors/:hours",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl where dl.log_type = 'ERROR' and timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/errors/device/:deviceid/:hours",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl where dl.log_type = 'ERROR' and device_id = ? and dl.timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.deviceid, parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/errors/device/:deviceid/range/:start/:end",function(req,res){
    var query = "select timestamp, device_id, log_type, message from device_log dl where dl.log_type = 'ERROR' and dl.device_id = ? and UNIX_TIMESTAMP(dl.timestamp) > ? and UNIX_TIMESTAMP(dl.timestamp) < ? order by dl.timestamp desc;";
    var table = [req.params.deviceid, req.params.start, req.params.end];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/errors/site/:siteid/:hours",function(req,res){
    //var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on d.device_id = dl.device_id where dl.log_type = 'ERROR' and d.site_id = ? order by dl.timestamp desc limit ?;";
    var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on d.device_id = dl.device_id inner join controllers c on d.controller_id = c.controller_id where dl.log_type = 'ERROR' and c.site_id = ? and dl.timestamp > (now() - INTERVAL ? hour) order by dl.timestamp desc;";
    var table = [req.params.siteid, parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/errors/site/:siteid/range/:start/:end",function(req,res){
    //var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on d.device_id = dl.device_id where dl.log_type = 'ERROR' and d.site_id = ?  and UNIX_TIMESTAMP(dl.timestamp) > ? and UNIX_TIMESTAMP(dl.timestamp) < ? order by dl.timestamp desc;";
    var query = "select dl.timestamp, dl.device_id, dl.log_type, dl.message from device_log dl inner join devices d on d.device_id = dl.device_id inner join controllers c on d.controller_id = c.controller_id where dl.log_type = 'ERROR' and c.site_id = ?  and UNIX_TIMESTAMP(dl.timestamp) > ? and UNIX_TIMESTAMP(dl.timestamp) < ? order by dl.timestamp desc;";
    var table = [req.params.siteid, req.params.start, req.params.end];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});























////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/ads/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* Implemented in endpoint API
router.get("/api/ads/file/:ad_id",function(req,res){
    console.log('Getting file')
    var img = req.params.ad_id;
    jpg_path = ad_dir + req.params.ad_id + '.jpg'
    if (fs.existsSync(jpg_path)) {
        console.log('I think the JPG exists')
        res.sendFile(jpg_path)
        return
    }
    mp4_path = ad_dir + req.params.ad_id + '.mp4'
    if (fs.existsSync(mp4_path)) {
        res.sendFile(mp4_path)
        return
    }
});
*/

router.get("/api/ads/summary/customer/:hours",function(req,res){
    var query = "select cu.name as customer_name, s.abbreviation, cu.cust_id, count(distinct al.ad_id) as num_ads, count(distinct s.site_id) as num_locations, count(al.ad_id) as impressions, sum(al.length)/60 as impression_mins from ad_log al  \
                inner join ads a on al.ad_id = a.ad_id  \
                inner join customers cu on cu.cust_id = a.cust_id  \
                inner join sites s on al.site_id = s.site_id  \
                and al.oper_hours = 1 and al.timestamp > (now() - INTERVAL ? hour) \
                group by cu.name;";
    var table = [req.params.hours];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/ads/summary/site/:hours",function(req,res){
    var query = "select s.site_name, s.abbreviation, s.site_id, count(distinct al.ad_id) as num_ads, count(distinct cu.name) as num_customers, count(al.ad_id) as impressions, coalesce(sum(al.length)/60, 0) as impression_mins from ad_log al  \
                inner join ads a on al.ad_id = a.ad_id  \
                inner join customers cu on cu.cust_id = a.cust_id  \
                right join sites s on al.site_id = s.site_id  \
                and al.oper_hours = 1 and al.timestamp > (now() - INTERVAL ? hour) \
                group by s.site_name;";
    var table = [req.params.hours];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.post('/api/ads', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO ads (cust_id, descrip, adtype) VALUES (?);";
    var values = [];
    values.push(params['cust_id']);
    values.push(params['descrip']);
    values.push(params['adtype']);
    connection.query(query, [values], function(err, results, fields){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : results.insertId});
        }
    });
});

// Ad File upload
router.post('/api/ads/:ad_id/:adtype', function (req, res) {
    var params  = req.body;
    if (!req.files)
        return res.status(400).json({"Error" : true, "Message" : "No files were uploaded."});

    //var table = [req.params.ad_id, req.params.custid];

    var adFile = req.files.adFile;

    // obtain the size of image
    if (req.params.adtype == 'image') {
        if (adFile.mimetype != 'image/jpeg') {
            if (err)
                return res.status(500).send('Invalid file type, please use a 1920x1080 JPG file type.');
        }
        adFile.mv(ad_dir + req.params.ad_id + '.jpg', function(err) {
            if (err)
                return res.status(500).send(err);
        });

        var sizeOf = require('image-size');
        sizeOf(ad_dir + req.params.ad_id + '.jpg', function (err, dimensions) {
          if (err){
            console.log(err);
            fs.unlink(ad_dir + req.params.ad_id + '.jpg', (err) => {
              if (err) throw err;
            });
            res.status(500).send(err);
          } else if (dimensions.width != 1920 || dimensions.height != 1080){
                fs.unlink(ad_dir + req.params.ad_id + '.jpg', (err) => {
                  if (err) throw err;
                });
                res.status(500).send(err);
            }
            else {
                md5File(ad_dir + req.params.ad_id + '.jpg', (err, hash) => {
                    if (err) throw err
                    var query = "update ads set md5 = ? where ad_id = ?;";
                    var values = [];
                    var md5val = hash
                    values.push(md5val);
                    values.push(req.params.ad_id);
                    query = mysql.format(query, values);
                    connection.query(query, function(err,rows){
                        if(err) {
                            res.json({"Error" : true, "Message" : err});
                        } else {
                            res.json({"Error" : false, "Message" : "Success"});
                        }
                    });
                })
          }
        });
    }

    if (req.params.adtype == 'video') {
        if (adFile.mimetype != 'video/mp4') {
            if (err)
                return res.status(500).send('Invalid file type, please use a MP4 file type for video.');
        }
        adFile.mv(ad_dir + req.params.ad_id + '.mp4', function(err) {
            if (err)
                return res.status(500).send(err);
        });
        md5File(ad_dir + req.params.ad_id + '.mp4', (err, hash) => {
            if (err) throw err
            var query = "update ads set md5 = ? where ad_id = ?;";
            var values = [];
            var md5val = hash
            values.push(md5val);
            values.push(req.params.ad_id);
            query = mysql.format(query, values);
            connection.query(query, function(err,rows){
                if(err) {
                    res.json({"Error" : true, "Message" : err});
                } else {
                    res.json({"Error" : false, "Message" : "Success"});
                }
            });
        })
    }
});
/*
router.post('/api/ads/:ad_id', function (req, res) {
    var params  = req.body;
    if (!req.files)
        return res.status(400).json({"Error" : true, "Message" : "No files were uploaded."});

    var adFile = req.files.adFile;

    adFile.mv(ad_dir + req.params.ad_id + '.jpg', function(err) {
        if (err)
            return res.status(500).send(err);
    });
    // obtain the size of image
    var sizeOf = require('image-size');
    sizeOf(ad_dir + req.params.ad_id + '.jpg', function (err, dimensions) {
        if (err){
            console.log(err);
            fs.unlink(ad_dir + req.params.ad_id + '.jpg', (err) => {
              if (err) throw err;
            });
            res.status(500).send(err);
        } else if (dimensions.width != 1920 || dimensions.height != 1080) {
            fs.unlink(ad_dir + req.params.ad_id + '.jpg', (err) => {
              if (err) throw err;
            });
            res.status(500).send(err);
        } else {
            md5File(ad_dir + req.params.ad_id + '.jpg', (err, hash) => {
                if (err) throw err
                var query = "update ads set md5 = ? where ad_id = ?;";
                var values = [];
                var md5val = hash
                values.push(md5val);
                values.push(req.params.ad_id);
                query = mysql.format(query, values);
                console.log(query)
                connection.query(query, function(err,rows){
                    if(err) {
                        res.json({"Error" : true, "Message" : err});
                    } else {
                        res.json({"Error" : false, "Message" : "Success"});
                    }
                });
            })
        }
    });
});
*/

router.get('/api/ads', function (req, res) {
    var query = "select a.ad_id, a.cust_id, c.name, a.descrip, a.adtype, a.md5 from ads a inner join customers c on a.cust_id = c.cust_id;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/ads/:ad_id', function (req, res) {
    var params  = req.body;
    var query = "update ads set descrip = ?, cust_id = ?, adtype = ? where ad_id = ?;";
    var values = [];
    values.push(params['descrip']);
    values.push(params['cust_id']);
    values.push(params['adtype']);
    values.push(req.params.ad_id);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/ads/:ad_id', function (req, res) {
    var query = "delete from ads WHERE ad_id = ?;";
    var table = [req.params.ad_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/campaigns/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/api/campaigns', function (req, res) {
    var params  = req.body;
    if (new Date(params['start_date']) < new Date() ) {
        res.json({"Error" : true, "Message" : "Campaigns cannot be created to start before today's date."});
    } else {
        var query = "INSERT INTO campaigns (campaign_name, start_date, end_date, site_id, notes, length, cpm_usd_cost, site_visitors, length_mons, monthly_usd_cost, ad_order, cust_id) VALUES (?);";
        var values = [];
        values.push(params['campaign_name']);
        values.push(params['start_date']);
        values.push(params['end_date']);
        values.push(params['site_id']);
        values.push(params['notes']);
        values.push(params['length']);
        values.push(params['cpm_usd_cost']);
        values.push(params['site_visitors']);
        values.push(params['length_mons']);
        values.push(params['monthly_usd_cost']);
        values.push(params['ad_order']);
        values.push(params['cust_id']);
        console.log(query, [values])
        connection.query(query, [values], function(err,rows){
            if(err) {
                res.json({"Error" : true, "Message" : err});
            } else {
                res.json({"Error" : false, "Message" : "Success", "data" : rows});
            }
        });
    }

    
});

router.get('/api/campaigns', function (req, res) {
    var params  = req.body;
    var query = "select c.campaign_id, c.campaign_name, c.start_date, c.end_date, c.site_id, s.site_name, c.notes, c.length, c.cpm_usd_cost, c.site_visitors, c.length_mons, c.monthly_usd_cost, c.ad_order, c.cust_id, cust.name from campaigns c inner join sites s on c.site_id = s.site_id inner join customers cust on cust.cust_id = c.cust_id order by site_id, ad_order;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });

});


router.put('/api/campaigns/:campaign_id', function (req, res) {
    var params  = req.body;
    var query = "update campaigns set campaign_name = ?, start_date = ?, end_date = ?, site_id = ?, notes = ?, length = ?, cpm_usd_cost = ?, site_visitors = ?, length_mons = ?, monthly_usd_cost = ?, ad_order = ?, cust_id = ? where campaign_id = ?;";
    var values = [];
    values.push(params['campaign_name']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(params['site_id']);
    values.push(params['notes']);
    values.push(params['length']);
    values.push(params['cpm_usd_cost']);
    values.push(params['site_visitors']);
    values.push(params['length_mons']);
    values.push(params['monthly_usd_cost']);
    values.push(params['ad_order']);
    values.push(params['cust_id']);
    values.push(req.params.campaign_id);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/campaigns/:campaign_id', function (req, res) {
    var query = "delete from campaigns WHERE campaign_id = ?;";
    var table = [req.params.campaign_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get('/api/campaigns/adstats', function (req, res) {
    var params  = req.body;
    var query = "call campaign_ad_count_vs_oper_hours_api(NULL, NULL, True, NULL);";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows[0]});
        }
    });
});

router.get('/api/campaigns/adstats/:campaign_id', function (req, res) {
    var params  = req.body;
    var query = "call campaign_ad_count_vs_oper_hours_api(?, True, NULL);";
    var table = [req.params.campaign_id];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows[0]});
        }
    });
});








////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/campaigns/ads
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/api/campaigns/ads', function (req, res) {
    var params  = req.body;

    var query = "select * from campaigns where campaign_id = ?;";
    var values = [];
    values.push(params['campaign_id']);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        var campaign = rows[0];
        if (new Date(campaign.start_date) > new Date(params['start_date'])) {
            res.json({"Error" : true, "Message" : "Start date must be after the campaign start date."});
        } else if (new Date(campaign.end_date) < new Date(params['end_date'])) {
            res.json({"Error" : true, "Message" : "End date must be before the campaign end date."});
        } else {
            var query = "INSERT INTO campaigns_ads (campaign_id, ad_id, start_date, end_date, approval_status, pending_campaign_ad_id) VALUES (?);";
            var values = [];
            values.push(params['campaign_id']);
            values.push(params['ad_id']);
            values.push(params['start_date']);
            values.push(params['end_date']);
            values.push('0');
            values.push('0');
            console.log(query, [values])
            connection.query(query, [values], function(err,rows){
                //if(err) {
                //    res.json({"Error" : true, "Message" : err});
                //} else {
                //    res.json({"Error" : false, "Message" : "Success", "data" : rows});
                //}
                if(err) {
                    res.json({"Error" : true, "Message" : err});
                } else {
                    res.json({"Error" : false, "Message" : "Success", "data" : rows});
                    if ( params['ad_id'] != '0') {
                        var textMessage = "Congratulations! A customer has chosen to put and advertisement in your facility. \
                            Please visit https://www.retikulate.com/partners/index.html#!/approvals/" + campaign.site_id + " in order to review and approve the ad.\
                            If the ad is not responded to within 7 days, Retikulate will review the ad and or approve or decline it\
                            using our best judgement.";
                        var htmlMessage = "Congratulations! A customer has chosen to put and advertisement in your facility. <br>\
                            Please visit the <a href=\"https://www.retikulate.com/partners/index.html#!/approvals/" + campaign.site_id + "\"> partner portal </a> in order to review and approve the ad.<br>\
                            If the ad is not responded to within 7 days, Retikulate will review the ad and approve or decline it\
                            using our best judgement.";
                        email.sendCampaignSiteEmail(params['campaign_id'], "Ad Approval Waiting for You", textMessage, htmlMessage);
                    }
                }
            });
        }
    });

});

router.get('/api/campaigns/ads', function (req, res) {
    var params  = req.body;
    //var query = "select c.campaign_id, c.start_date, c.end_date, c.site_id, s.site_name, c.notes, c.length, c.cpm_usd_cost, c.site_visitors, c.length_mons, c.monthly_usd_cost, c.ad_order from campaigns c inner join sites s on c.site_id = s.site_id order by site_id, ad_order;";
    var query = "select c.campaign_ad_id, c.campaign_id, c.ad_id, a.descrip, c.start_date, c.end_date, c.approval_status, c.pending_campaign_ad_id from campaigns_ads c inner join ads a on c.ad_id = a.ad_id order by campaign_ad_id;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/campaigns/ads/:campaign_ad_id', function (req, res) {
    //check current values
    var current_status = [];
    var params  = req.body;
    var query = "select s.site_name, c.campaign_ad_id, c.campaign_id, c.ad_id, a.descrip, c.start_date, c.end_date, c.approval_status, c.pending_campaign_ad_id from campaigns_ads c inner join ads a on c.ad_id = a.ad_id inner join campaigns cam on c.campaign_id = cam.campaign_id inner join sites s on s.site_id = cam.site_id where c.campaign_ad_id = ?;";
    var values = [];
    values.push(params['campaign_ad_id']);
    query = mysql.format(query, values);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            current_status = rows[0];
            
            if (current_status.ad_id != params['ad_id']){
                var query = "INSERT INTO campaigns_ads (campaign_id, ad_id, start_date, end_date, approval_status, pending_campaign_ad_id) VALUES (?);";
                var values = [];
                values.push(params['campaign_id']);
                values.push(params['ad_id']);
                values.push(params['start_date']);
                values.push(params['end_date']);
                values.push(0);
                values.push(params['campaign_ad_id']);
    
                connection.query(query, [values], function(err,rows){
                    if(err) {
                        console.log(err);
                        res.json({"Error" : true, "Message" : err});
                    } else {
                        res.json({"Error" : false, "Message" : "Success", "data" : rows});
                        //only send email is ad id changes
                        if ( params['ad_id'] != '0' ) {
                            var textMessage = "A customer has asked to edit the artwork on an existing campaign (Campaign ID " + params['campaign_id'] + ") in your facility. \
                                Please visit https://www.retikulate.com/partners/index.html#!/approvals/" + params['site_id'] + " in order to review and approve the ad.\
                                If the ad is not approved within 7 days, Retikulate will review the ad and or approve or decline it\
                                using our best judgement.";
                            var htmlMessage = "A customer has asked to edit the artwork on an existing campaign (Campaign ID " + params['campaign_id'] + ") in your facility. \
                                Please visit https://www.retikulate.com/partners/index.html#!/approvals/" + params['site_id'] + " in order to review and approve the ad.\
                                If the ad is not approved within 7 days, Retikulate will review the ad and or approve or decline it\
                                using our best judgement.";
                            email.sendCampaignSiteEmail(params['campaign_id'], "Ad Approval Waiting for You", textMessage, htmlMessage);
                        }
                    }
                });
            } else {
                var query = "update campaigns_ads set campaign_id = ?, ad_id = ?, start_date = ?, end_date = ?, approval_status = ?, pending_campaign_ad_id = ? where campaign_ad_id = ?;";
                var values = [];
                values.push(params['campaign_id']);
                values.push(params['ad_id']);
                values.push(params['start_date']);
                values.push(params['end_date']);
                values.push(params['approval_status']);
                values.push(params['pending_campaign_ad_id']);
                values.push(params['campaign_ad_id']);
                query = mysql.format(query, values);
                console.log(query)
                connection.query(query, function(err,rows){
                    if(err) {
                        res.json({"Error" : true, "Message" : err});
                    } else {
                        res.json({"Error" : false, "Message" : "Success", "data" : rows});
                    }
                });

                var query = "select s.site_name, c.campaign_ad_id, c.campaign_id, c.ad_id, a.descrip, c.start_date, c.end_date, c.approval_status, \
                    c.pending_campaign_ad_id from campaigns_ads c inner join ads a on c.ad_id = a.ad_id inner join campaigns cam on c.campaign_id = \
                    cam.campaign_id inner join sites s on s.site_id = cam.site_id where c.campaign_ad_id = ?;";
                var values = [];
                values.push(params['campaign_ad_id']);
                query = mysql.format(query, values);
                console.log(query);
                connection.query(query, function(err,rows){
                    new_status = rows[0];
                });

                //deactivate old campaign_ad and send customer an email if their ad got approved
                if (current_status.approval_status == 0 && params['approval_status'] == 1){
                    var query = "update campaigns_ads set approval_status = 3 where campaign_ad_id = ?;";
                    var values = [];
                    values.push(params['pending_campaign_ad_id']);
                    query = mysql.format(query, values);
                    console.log(query)
                    connection.query(query, function(err,rows){
                    });

                    var query = "select a.cust_id from ads a where a.ad_id = ?;";
                    var values = [];
                    values.push(params['ad_id']);
                    query = mysql.format(query, values);
                    connection.query(query,function(err,rows){
                        ad = rows[0];
                        var cust_id = ad.cust_id;
                        console.log(cust_id);
                        var textMessage = 'Congratulations! Your update to campaign id ' + params['campaign_id'] + ' \
                            has been approved and activated.';
                        var htmlMessage = 'Congratulations! Your update to campaign id ' + params['campaign_id'] + ' \
                            has been approved and activated.  Your ad named "' + new_status.descrip + '" is now running at ' + new_status.site_name + '\
                            <br><br>Please keep in mind that you can also login to our \
                            <a href="https://www.retikulate.com/customers">customer portal</a> and view more detailed \
                            reports.  The portal will allow you to see how your campaigns are doing, up to the minute, \
                            in every location.  If you have not logged in before, you can \
                            <a href="https://www.retikulate.com/recover">recover</a> your password using this email \
                            address as your login.<br><br> As always, please email <a href="mailto:support@retikulate.com">\
                            support@retikulate.com</a> with any questions. <br><br>'
                            
                        email.sendCustomerEmail(cust_id, "Campaign ID " + params['campaign_id'] + " approval", textMessage, htmlMessage);
                    });
                }

                //send customer an email if their ad got rejects
                if (current_status.approval_status == 0 && params['approval_status'] == 2){
                    var query = "select a.cust_id from ads a where a.ad_id = ?;";
                    var values = [];
                    values.push(params['ad_id']);
                    query = mysql.format(query, values);
                    connection.query(query,function(err,rows){
                        ad = rows[0];
                        var cust_id = ad.cust_id;
                        console.log(cust_id);
                        var textMessage = "Sorry, but your update to campaign id " + params['campaign_id'] + " \
                            has been rejected.  If you have questions or concerns please contact us at support@retikulate.com."

                        var htmlMessage = 'Sorry, but your update to campaign id ' + params['campaign_id'] + ' for your ad named \
                            "' + new_status.descrip + '" has been rejected.  You can login to your \
                            <a href="https://www.retikulate.com/customers">customer portal</a> and upload new artwork for this \
                            campaign if you would like.<br><br>If you have questions or concerns please contact us at support@retikulate.com.';
                        email.sendCustomerEmail(cust_id, 'Campaign ID ' + params['campaign_id'] + ' rejected', textMessage, htmlMessage);
                    });
                }
            }
        }
    });
});


router.delete('/api/campaigns/ads/:campaign_ad_id', function (req, res) {
    var query = "delete from campaigns_ads WHERE campaign_ad_id = ?;";
    var table = [req.params.campaign_ad_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});









////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/opassigments/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/api/opassignments', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO op_assignments (operator_id, chan_id, event_type_id, event_name, start_date, end_date) VALUES (?);";
    var values = [];
    values.push(params['operator_id']);
    values.push(params['chan_id']);
    values.push(params['event_type_id']);
    values.push(params['event_name']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    console.log(query, [values])
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get('/api/opassignments', function (req, res) {
    var params  = req.body;
    var query = "select o.assignment_id, o.operator_id, op.firstname, op.lastname, o.chan_id, c.name, o.event_type_id, e.description, o.event_name,\
        o.start_date, o.end_date, o.check_in_time, o.last_update, o.commercial_count from op_assignments o inner join event_type e on o.event_type_id = e.event_type_id inner join channels c on o.chan_id = c.chan_id inner join operators op on o.operator_id = op.operator_id;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/opassignments/:assignment_id', function (req, res) {
    var params  = req.body;
    var query = "update op_assignments set operator_id = ?, chan_id = ?, event_type_id = ?, event_name = ?, start_date = ?, end_date = ? where assignment_id = ?;";
    var values = [];
    values.push(params['operator_id']);
    values.push(params['chan_id']);
    values.push(params['event_type_id']);
    values.push(params['event_name']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(req.params.assignment_id);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/opassignments/:assignment_id', function (req, res) {
    var query = "delete from op_assignments WHERE assignment_id = ?;";
    var table = [req.params.assignment_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/mlassigments/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/api/mlassignments', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO ml_assignments (chan_id, event_type_id, event_name, start_date, end_date, script) VALUES (?);";
    var values = [];
    values.push(params['chan_id']);
    values.push(params['event_type_id']);
    values.push(params['event_name']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(params['script']);
    console.log(query, [values])
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get('/api/mlassignments', function (req, res) {
    var params  = req.body;
    var query = "select m.assignment_id, m.chan_id, c.name, m.event_type_id, e.description, m.event_name,\
        m.start_date, m.end_date, m.script from ml_assignments m inner join event_type e on m.event_type_id = e.event_type_id inner join channels c on m.chan_id = c.chan_id;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/mlassignments/:assignment_id', function (req, res) {
    var params  = req.body;
    var query = "update ml_assignments set chan_id = ?, event_type_id = ?, event_name = ?, start_date = ?, end_date = ?, script = ? where assignment_id = ?;";
    var values = [];
    values.push(params['chan_id']);
    values.push(params['event_type_id']);
    values.push(params['event_name']);
    values.push(params['start_date']);
    values.push(params['end_date']);
    values.push(params['script']);
    values.push(req.params.assignment_id);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get('/api/mlassignments/channel/:channel_name', function (req, res) {
    var query = "select m.assignment_id, m.chan_id, c.name, m.event_type_id, e.description, m.event_name,\
        m.start_date, m.end_date, m.script from ml_assignments m inner join event_type e on m.event_type_id = e.event_type_id \
        inner join channels c on m.chan_id = c.chan_id where c.name like ? and m.end_date > now() and m.start_date < now();";
    var table = [req.params.channel_name];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/mlassignments/:assignment_id', function (req, res) {
    var query = "delete from ml_assignments WHERE assignment_id = ?;";
    var table = [req.params.assignment_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/eventtypes/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.post('/api/eventtypes', function (req, res) {
    var params  = req.body;
    var query = "INSERT INTO event_type (description) VALUES (?);";
    var values = [];
    values.push(params['description']);
    console.log(query, [values])
    connection.query(query, [values], function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get('/api/eventtypes', function (req, res) {
    var params  = req.body;
    var query = "select e.event_type_id, e.description from event_type e;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.put('/api/eventtypes/:event_type_id', function (req, res) {
    var params  = req.body;
    var query = "update event_type set description = ? where event_type_id = ?;";
    var values = [];
    values.push(params['description']);
    values.push(req.params.event_type_id);
    query = mysql.format(query, values);
    console.log(query)
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.delete('/api/eventtypes/:event_type_id', function (req, res) {
    var query = "delete from event_type WHERE event_type_id = ?;";
    var table = [req.params.event_type_id];
    query = mysql.format(query,table);
    console.log(query)
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/config/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/config/device/:deviceid",function(req,res){
    var query = "select * FROM device_config  where device_id = ?;";
    var table = [req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/config/controller/:controllerid",function(req,res){
    var query = "select * FROM controllers where controller_id = ?;";
    var table = [req.params.controllerid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
            if (typeof rows[0] !== 'undefined') {
                if (rows[0]['reset_flag'] == 1) {
                    console.log("SETTING FLAG")
                    var query = "UPDATE retikulate.controllers SET reset_flag = ? WHERE controller_id = '" + req.params.controllerid +"';";
                    var values = [0];
                    connection.query(query, [values], function(err,rows){
                    });
                }  
            }   
        }
    });
});

router.get("/api/config/operating_hours/:controllerid",function(req,res){
    var query = "select oh.day_of_week, oh.start_time, oh.end_time from operating_hours oh inner join sites s on oh.site_id = s.site_id inner join controllers c on c.site_id = s.site_id where c.controller_id = ?;";
    var table = [req.params.controllerid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});




















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/adconfig/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.get("/api/adconfig/site/:siteid",function(req,res){
    //var query = "select campaigns.ad_id, ads.adtype, campaigns.length FROM ads INNER JOIN campaigns ON ads.ad_id = campaigns.ad_id where campaigns.site_id = ? and campaigns.start_date < CURRENT_TIMESTAMP() and campaigns.end_date > CURRENT_TIMESTAMP() ORDER BY campaigns.ad_order;";
    var query = "select campaigns_ads.ad_id, ads.adtype, campaigns.length FROM campaigns_ads INNER JOIN ads ON ads.ad_id = campaigns_ads.ad_id INNER JOIN campaigns ON campaigns.campaign_id = campaigns_ads.campaign_id where campaigns_ads.approval_status = 1 and campaigns.site_id = ? and campaigns_ads.start_date < CURRENT_TIMESTAMP() and campaigns_ads.end_date > CURRENT_TIMESTAMP() ORDER BY campaigns.ad_order;";
    var table = [req.params.siteid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});








////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/channeldetect/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get("/api/channeldetect/log/:seconds",function(req,res){
    var query = "select cdl.timestamp, cdl.device_id, cdl.channel, cdl.confidence from channel_detect_log cdl where time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/log/device/:deviceid/:seconds",function(req,res){
    var query = "select cdl.timestamp, cdl.device_id, s.site_name, cdl.channel, cdl.confidence from channel_detect_log cdl inner join devices d on cdl.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where d.device_id= ? and time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [req.params.deviceid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/channeldetect/log/site/:siteid/:seconds",function(req,res){
    var query = "select cdl.timestamp, cdl.device_id, s.site_name, cdl.channel, cdl.confidence from channel_detect_log cdl inner join devices d on cdl.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where s.site_id = ? and time_to_sec(timediff(now(), timestamp)) < ? order by timestamp desc;";
    var table = [req.params.siteid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/hits/summary/:seconds",function(req,res){
    var query = "select d.device_id, s.site_name, count(cdl.device_id) as hits from channel_detect_log cdl right join devices d on cdl.device_id = d.device_id and cdl.confidence > 75 and time_to_sec(timediff(now(), cdl.timestamp)) < ? inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where c.device_type = 1 group by d.device_id;";
    var table = [parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/hits/device/:deviceid/:seconds",function(req,res){
    var query = "select d.device_id, s.site_name, count(cdl.device_id) as hits from channel_detect_log cdl inner join devices d on cdl.device_id = d.device_id inner join  controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where cdl.confidence > 75 and d.device_id = 2024815906478561 and time_to_sec(timediff(now(), cdl.timestamp)) < 100;";
    var table = [req.params.deviceid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/hits/site/:siteid/:seconds",function(req,res){
    var query = "select s.site_id, s.site_name, count(cdl.device_id) as hits from channel_detect_log cdl inner join devices d on cdl.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where cdl.confidence > 75 and s.site_id = ? and time_to_sec(timediff(now(), cdl.timestamp)) < ?;";
    var table = [req.params.siteid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/hits/byhour/device/:deviceid/:hours",function(req,res){
    var query = "select h.hour as timestamp, coalesce(count(cdl.device_id), 0) as hits from \
                    (SELECT date_format(date_sub(now(), INTERVAL 1 Day) + INTERVAL seq HOUR, '%Y-%m-%d %H:00:00') AS hour FROM seq_0_to_9999 where seq < ?) h \
                left join \
                    (select date_format(cdl.timestamp,'%Y-%m-%d %H:00:00') as hour, cdl.device_id from channel_detect_log cdl where device_id = ? and cdl.confidence > 75) cdl \
                on cdl.hour = h.hour group by h.hour;";
    var table = [parseInt(req.params.hours), req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


router.get("/api/channeldetect/current_channel",function(req,res){
    //var query = "select d.device_id, s.site_name, d.device_name, upper(coalesce(max(substr(channel, 1, locate('-', channel) - 1)), \"UNKNOWN\")) as channel from channel_detect_log cdl right join devices d on cdl.device_id = d.device_id and cdl.timestamp > (now() - INTERVAL 2 minute) and cdl.confidence > 75 and d.device_type = 1 inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id and s.testdev = 0 group by d.device_id order by s.site_name, d.device_name;"
    var query = "select d.device_id, s.site_name, s.site_id, d.device_name, upper(coalesce(max(substr(cdl.channel, 1, locate('-', cdl.channel) - 1)), \"UNKNOWN\")) as channel,\
                upper(coalesce(max(substr(lc.channel, 1, locate('-', lc.channel) - 1)), \"UNKNOWN\")) as last_channel, coalesce(lc.minutes_ago, 2880) as minutes_ago \
                from channel_detect_log cdl \
                right join devices d on cdl.device_id = d.device_id and cdl.timestamp > (now() - INTERVAL 2 minute) and cdl.confidence > 75  \
                inner join controllers c on d.controller_id = c.controller_id and c.device_type = 1\
                inner join sites s on c.site_id = s.site_id and (s.testdev = 0 or s.testdev = 1) \
                left join\
                (select timestampdiff(MINUTE, maxts.timestamp, now()) as minutes_ago, maxts.device_id, cdl.channel from channel_detect_log cdl inner join\
                (select max(timestamp) as timestamp, device_id from channel_detect_log where timestamp > (now() - INTERVAL 2 day) \
                and confidence > 100 group by device_id) maxts\
                on maxts.timestamp = cdl.timestamp and cdl.device_id = maxts.device_id) lc\
                on lc.device_id = d.device_id\
                where c.device_type = 1\
                group by d.device_id order by s.site_name, d.device_name;"
    query = mysql.format(query);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channeldetect/current_channel/site/:siteid",function(req,res){
    var query = "select d.device_id, d.device_name, coalesce(max(cdl.timestamp), now()) as timestamp, coalesce(max(channel), \"None\") as channel from channel_detect_log cdl right join devices d on cdl.device_id = d.device_id and cdl.timestamp > (now() - INTERVAL 2 minute) and cdl.confidence > 75 inner join controllers c on d.controller_id = c.controller_id where c.device_type = 1 and c.site_id = ? group by d.device_id;";
    var table = [parseInt(req.params.siteid)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



router.get("/api/channeldetect/current_channel/summary",function(req,res){
    var query = "select UPPER(c.name) as channel, count(derived.device_id) as device_count, count(distinct derived.site_id) as site_count from channels c \
                LEFT JOIN \
                (select d.device_id, d.device_name, c.device_type, s.site_id, coalesce(max(cdl.timestamp), now()) as timestamp, coalesce(max(substr(channel, 1, locate('-', channel) - 1)), \"UNKNOWN\") as channel from channel_detect_log cdl right join devices d on cdl.device_id = d.device_id and cdl.timestamp > (now() - INTERVAL 2 minute) and cdl.confidence > 75  inner join controllers c on d.controller_id = c.controller_id and c.device_type = 1 inner join sites s on c.site_id = s.site_id and s.testdev = 0 group by d.device_id) as derived \
                on c.name = derived.channel \
                where derived.device_type = 1\
                group by c.name \
                order by device_count desc;";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});














////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/channelstatus/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.get("/api/channelstatus/ad_minutes/summary/:seconds",function(req,res){
    var query = "select d.device_id, s.site_name, coalesce(sum(cs.seconds)/60, 0) ad_minutes from chan_status cs right join devices d on cs.device_id = d.device_id and cs.status = 1 and time_to_sec(timediff(now(), cs.timestamp)) < ? inner join  controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where c.device_type = 1 group by d.device_id;";
    var table = [parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_minutes/device/:deviceid/:seconds",function(req,res){
    var query = "select d.device_id, s.site_name, coalesce(sum(cs.seconds)/60, 0) as ad_minutes from chan_status cs inner join devices d on cs.device_id = d.device_id inner join  controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where d.device_id = ? and cs.status = 1 and time_to_sec(timediff(now(), cs.timestamp)) < ?;";
    var table = [req.params.deviceid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_minutes/site/:siteid/:seconds",function(req,res){
    var query = "select s.site_id, s.site_name, coalesce(sum(cs.seconds)/60, 0) as ad_minutes from chan_status cs inner join devices d on cs.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id where s.site_id = 2 and cs.status = 1 and time_to_sec(timediff(now(), cs.timestamp)) < 1000000;";
    var table = [req.params.siteid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_minutes/byhour/device/:deviceid/:hours",function(req,res){
    var query = "select h.hour as timestamp, coalesce(sum(cs.seconds)/60, 0) as ad_minutes from \
                    (SELECT date_format(date_sub(now(), INTERVAL 1 Day) + INTERVAL seq HOUR, '%Y-%m-%d %H:00:00') AS hour FROM seq_0_to_9999 where seq < ?) h \
                left join \
                    (select date_format(cs.timestamp,'%Y-%m-%d %H:00:00') as hour, cs.seconds from chan_status cs where device_id = ? and cs.status = 1) cs \
                on cs.hour = h.hour group by h.hour;";
    var table = [parseInt(req.params.hours), req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_mins_hits/summary/:hours",function(req,res){
    var query = "select cs.device_id, cs.site_name, coalesce(al.ad_minutes, 0) as ad_minutes, cs.commercial_minutes, coalesce(cdl.audio_minutes, 0) as audio_minutes, \
                coalesce(ad_minutes / cs.commercial_minutes, 0) ad2comm_perc, coalesce(ad_minutes / audio_minutes, 0) ad2audio_perc, coalesce(commercial_minutes / audio_minutes, 0) comm2audio_perc \
                from \
                (select d.device_id, s.site_name, s.site_id, coalesce(sum(cs.seconds)/60, 0) commercial_minutes \
                from chan_status cs right join devices d on cs.device_id = d.device_id and cs.status = 1 and cs.timestamp > (now() - INTERVAL ? hour) \
                inner join controllers c on d.controller_id = c.controller_id \
                inner join sites s on c.site_id = s.site_id where c.device_type = 1 group by d.device_id ) cs \
                left join \
                (select d.device_id, coalesce(sum(a.length)/60, 0) ad_minutes \
                from devices d inner join ad_log al on al.device_id = d.device_id and al.timestamp > (now() - INTERVAL ? hour) \
                left join campaigns a on al.campaign_id = a.campaign_id group by d.device_id) al \
                on cs.device_id = al.device_id \
                left join \
                (select cdl.device_id, count(cdl.device_id) as audio_minutes from channel_detect_log cdl where cdl.confidence > 75 and cdl.timestamp > (now() - INTERVAL ? hour) \
                group by cdl.device_id) cdl \
                on cs.device_id = cdl.device_id \
                order by cs.site_id, ad_minutes desc;";
    var table = [parseInt(req.params.hours), parseInt(req.params.hours), parseInt(req.params.hours)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_mins_hits/summary/site/:siteid/:hours",function(req,res){
    var query = "select cs.device_id, cs.site_name, coalesce(al.ad_minutes, 0) as ad_minutes, cs.commercial_minutes, coalesce(cdl.audio_minutes, 0) as audio_minutes, \
                coalesce(ad_minutes / cs.commercial_minutes, 0) ad2comm_perc, coalesce(ad_minutes / audio_minutes, 0) ad2audio_perc, coalesce(commercial_minutes / audio_minutes, 0) comm2audio_perc \
                from \
                (select d.device_id, s.site_name, s.site_id, coalesce(sum(cs.seconds)/60, 0) commercial_minutes \
                from chan_status cs right join devices d on cs.device_id = d.device_id and cs.status = 1 and cs.timestamp > (now() - INTERVAL ? hour) \
                inner join controllers c on d.controller_id = c.controller_id \
                inner join sites s on c.site_id = s.site_id where c.device_type = 1 group by d.device_id ) cs \
                left join \
                (select d.device_id, coalesce(sum(a.length)/60, 0) ad_minutes \
                from devices d inner join ad_log al on al.device_id = d.device_id and al.timestamp > (now() - INTERVAL ? hour) \
                left join campaigns a on al.campaign_id = a.campaign_id group by d.device_id) al \
                on cs.device_id = al.device_id \
                left join \
                (select cdl.device_id, count(cdl.device_id) as audio_minutes from channel_detect_log cdl where cdl.confidence > 75 and cdl.timestamp > (now() - INTERVAL ? hour) \
                group by cdl.device_id) cdl \
                on cs.device_id = cdl.device_id \
                where cs.site_id = ? \
                order by cs.site_id, ad_minutes desc;";
    var table = [parseInt(req.params.hours), parseInt(req.params.hours), parseInt(req.params.hours), req.params.siteid,];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

router.get("/api/channelstatus/ad_mins_hits/byhour/device/:deviceid/:hours",function(req,res){
    var query = "select cdl.hour as timestamp, round(ad_mins, 2) as ad_mins, round(commercial_mins,2) as commercial_mins, hits from \
                (select h.hour, coalesce(count(cdl.device_id), 0) as hits from \
                (SELECT date_format(date_sub(now(), INTERVAL 1 Day) + INTERVAL seq HOUR, '%Y-%m-%d %H:00:00') AS hour FROM seq_0_to_9999 where seq < ?) h \
                left join \
                (select date_format(cdl.timestamp,'%Y-%m-%d %H:00:00') as hour, cdl.device_id from channel_detect_log cdl where device_id = ? and cdl.confidence > 75) cdl \
                on cdl.hour = h.hour group by h.hour) cdl \
                inner join \
                (select h.hour, coalesce(sum(cs.seconds)/60, 0) as commercial_mins from \
                (SELECT date_format(date_sub(now(), INTERVAL 1 Day) + INTERVAL seq HOUR, '%Y-%m-%d %H:00:00') AS hour FROM seq_0_to_9999 where seq < ?) h \
                left join \
                (select date_format(cs.timestamp,'%Y-%m-%d %H:00:00') as hour, cs.seconds from chan_status cs where device_id = ? and cs.status = 1) cs \
                on cs.hour = h.hour group by h.hour) cs \
                inner join \
                (select h.hour, coalesce(sum(a.length)/60, 0) as ad_mins from \
                (SELECT date_format(date_sub(now(), INTERVAL 1 Day) + INTERVAL seq HOUR, '%Y-%m-%d %H:00:00') AS hour FROM seq_0_to_9999 where seq < ?) h \
                left join \
                (select date_format(al.timestamp,'%Y-%m-%d %H:00:00') as hour, a.length from ad_log al inner join ads a on al.ad_id = a.ad_id where device_id = ?) a \
                on a.hour = h.hour group by h.hour) a \
                on cdl.hour = cs.hour and cdl.hour = a.hour \
                group by cdl.hour;";
    var table = [parseInt(req.params.hours), req.params.deviceid, parseInt(req.params.hours), req.params.deviceid, parseInt(req.params.hours), req.params.deviceid];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/channelstatus/log/:seconds",function(req,res){
    var query = "select cs.timestamp, cs.device_id, s.site_name, case when cs.status = 0 then 'PROGRAMMING' else 'COMMERCIAL' end as status, c.name, cs.seconds from chan_status cs inner join devices d on cs.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id inner join channels c on cs.chan_id = c.chan_id where time_to_sec(timediff(now(), cs.timestamp)) < ? order by cs.timestamp desc;";
    var table = [parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/channelstatus/log/device/:deviceid/:seconds",function(req,res){
    var query = "select cs.timestamp, cs.device_id, s.site_name, case when cs.status = 0 then 'PROGRAMMING' else 'COMMERCIAL' end as status, c.name, cs.seconds from chan_status cs inner join devices d on cs.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id inner join channels c on cs.chan_id = c.chan_id where d.device_id = ? and time_to_sec(timediff(now(), cs.timestamp)) < ? order by cs.timestamp desc;";
    var table = [req.params.deviceid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

// CHANGE-SITEIDx
router.get("/api/channelstatus/log/site/:siteid/:seconds",function(req,res){
    var query = "select cs.timestamp, cs.device_id, s.site_name, case when cs.status = 0 then 'PROGRAMMING' else 'COMMERCIAL' end as status, c.name, cs.seconds from chan_status cs inner join devices d on cs.device_id = d.device_id inner join controllers c on d.controller_id = c.controller_id inner join sites s on c.site_id = s.site_id inner join channels c on cs.chan_id = c.chan_id where s.site_id = ? and time_to_sec(timediff(now(), cs.timestamp)) < ? order by cs.timestamp desc;";
    var table = [req.params.siteid, parseInt(req.params.seconds)];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/email/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/api/email', function (req, res) {
    var params  = req.body;
    var emailaddress = params['email'];
    var subject = params['subject'];
    var text = params['text'];
    var html = params['html'];

    email.sendEmail(emailaddress, subject, text, html);
    res.json({"Error" : false, "Message" : "Message sent"});
});

router.post('/api/email/operators', function (req, res) {
    var params  = req.body;
    var subject = params['subject'];
    var text = params['text'];
    var html = params['html'];

    var query = "select u.email from operators o inner join users u on u.operator_id = o.operator_id where o.email_alert=1 and u.status = 'active';";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            rows.forEach(function(value){
                var emailaddress = value['email'];
                console.log(emailaddress);
                email.sendEmail(emailaddress, subject, text, html);
            });
            res.json({"Error" : false, "Message" : "All messages sent successfully"});
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/sms/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/api/sms/', function (req, res) {
    var params  = req.body;
    var message = params['message']
    var phonenumber = params['phonenumber']
    var options = {
      mode: 'text',
      pythonPath: '/usr/bin/python',
      pythonOptions: ['-u'],
      scriptPath: '/opt/retikulate_dashboard',
      args: [phonenumber, message]
    };
    
    PythonShell.run('sms.py', options, function (err, results) {
        if (err){
            console.log(err)
            res.json({"Error" : true, "Message" : "Error sending message"});
        } else {
            res.json({"Error" : false, "Message" : "Message sent successfully"});
        }
    });
    res.json({"Error" : false, "Message" : "Message sent"});
});

router.post('/api/sms/operators', function (req, res) {
    var params  = req.body;
    var message = params['message'];
    var errorcount = 0;
    var successcount = 0;
    var failures = [];
    //var phones = [];
    
    var query = "select phone from operators o inner join users u on u.operator_id = o.operator_id where o.text_alert=1 and u.status = 'active';";
    connection.query(query,function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            rows.forEach(function(value){
                var phonenumber = '+1' + value['phone']
                var options = {
                  mode: 'text',
                  pythonPath: '/usr/bin/python',
                  pythonOptions: ['-u'],
                  scriptPath: '/opt/retikulate_dashboard',
                  args: [phonenumber, message]
                };
                PythonShell.run('sms.py', options, function (err, results) {
                    if (err){
                        errorcount++;
                        values.push(phonenumber);
                    } else {
                        successcount++;
                    }
                });
            });
            if (errorcount > 0 ){
                res.json({"Error" : true, "Message" : "Failed sending messages to: " + failures});
            } else {
                res.json({"Error" : false, "Message" : "All messages sent successfully"});
            }
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/signup/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/api/signup', function (req, res) {
    var params  = req.body;
    var query = "select email from users where email = ?";
    var table = [params['email']];

    var bodyData = {
        "display_name": params['name'],
        "first_name": params['fname'],
        "last_name": params['lname'],
        "email": params['email'],
        "company_name": params['name'],
        "phone": params['phone'],
        "billing_address": {
            "attention": params['fname'] + " " + params['lname'],
            "street": params['address1'],
            "street2": params['address2'],
            "city": params['city'],
            "state": params['state'],
            "zip": params['zip'],
            "country": "U.S.A"
        },
        "shipping_address": {
            "attention": params['fname'] + " " + params['lname'],
            "street": params['address1'],
            "street2": params['address2'],
            "city": params['city'],
            "state": params['state'],
            "zip": params['zip'],
            "country": "U.S.A"
        }
    };  
        
    console.log(bodyData);
    bodyData = JSON.stringify(bodyData); 

    var options = {
        url: config['production'].zoho_subscriptions_url + '/api/v1/customers',
        method: 'POST',
        headers: {
            'Authorization': config['production'].zoho_subscriptions_authz,
            'Content-type': 'application/json;charset=UTF-8',
            'X-com-zoho-subscriptions-organizationid': config['production'].zoho_subscriptions_orgid
        },
        body: bodyData
    };

    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if (rows.length != 0) {
            res.json({"Error" : true, "Message" : "Email already exists"});
            console.log("Email Already Exists");
        } else {      
            function callback(error, response, body) {
              var data = JSON.parse(response.body);
              console.log("SIGNUP DATA: " + data);
              if (error){
                res.json({"Error" : true, "Message" : error});
                console.log("SIGNUP ERROR: Inserting into subscriptions, " + error)
              } else {   
                if (response.statusCode == 201 && data.code == 0) {
                  var zoho_cust_id = data.customer.customer_id
                  var query = "insert into customers (name, address1, address2, city, state, zip, phone, subscrip_cust_id) VALUES (?);";
                  var values = [];
                  values.push(params['name']);
                  values.push(params['address1']);
                  values.push(params['address2']);
                  values.push(params['city']);
                  values.push(params['state']);
                  values.push(params['zip']);
                  values.push(params['phone']);
                  values.push(zoho_cust_id);
                  connection.query(query, [values], function(err, results){
                      if(err) {
                          res.json({"Error" : true, "Message" : err});
                          console.log("SIGNUP ERROR: Inserting into customers, " + err)
                      } else {
                          customer_id = results.insertId
                          console.log("Created customer Id: " + customer_id);
                          var params  = req.body;
                          var query = "insert into users (email, password, firstname, lastname, status, cust_id) VALUES (?);";
                          var values = [];
                          values.push(params['email']);
                          values.push(bCrypt.hashSync(params['password'], bCrypt.genSaltSync(8), null));
                          values.push(params['fname']);
                          values.push(params['lname']);
                          values.push('active');
                          values.push(customer_id);
                          connection.query(query, [values], function(err,rows){
                              if(err) {
                                  res.json({"Error" : true, "Message" : err});
                                  console.log("SIGNUP ERROR: Inserting into users, " + err);
                              } else {
                                  res.json({"Error" : false, "Message" : "Success", "data" : rows});
                                  console.log("Signup complete");
                              }
                          });
                      }
                  });
                } else {
                  res.json({"Error" : true, "Message" : data.message});
                  console.log("SIGNUP ERROR: Inserting into subscriptions, " + data.message)
                }
              }
            }
            request(options, callback);
        }
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/sales/invoices/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.get("/api/sales/invoices", function (req, res) {
    var decoded = jwt.verify(req.cookies.jwt, jwt_key);
    var userid = decoded.id;
    var userdata = [];
    var userdata2 = [];

    var options1 = {
        url: config['production'].zoho_subscriptions_url + '/api/v1/invoices?filter_by=Status.Paid',
        method: 'GET',
        headers: {
            'Authorization': config['production'].zoho_subscriptions_authz,
            'Content-type': 'application/json;charset=UTF-8',
            'X-com-zoho-subscriptions-organizationid': config['production'].zoho_subscriptions_orgid
        }
    };
    
    function callback1(error, response, body) {
        var data = JSON.parse(response.body);
        for (invoice in data.invoices){  
            if (data.invoices[invoice].cf_sales_user_id == userid ){
                userdata.push(data.invoices[invoice]);
            }
        }

        if (error){
            console.log("ERROR1");
            res.json({"Error" : true, "Message" : error});
        } else {  
            numinvoices = Object.keys(userdata).length;
            numcount = 0;
            for (var invoice in userdata) {
                var options2 = {
                    url: config['production'].zoho_subscriptions_url + '/api/v1/invoices/' + userdata[invoice]['invoice_id'],
                    method: 'GET',
                    headers: {
                        'Authorization': config['production'].zoho_subscriptions_authz,
                        'Content-type': 'application/json;charset=UTF-8',
                        'X-com-zoho-subscriptions-organizationid': config['production'].zoho_subscriptions_orgid
                    }
                };
                    
                function callback2(error, response, body) {
                    var data2 = JSON.parse(response.body);
                    numcount++;
                    //var userdata2 = [];
                    userdata2.push(data2['invoice']);
                    if (error){
                      res.json({"Error" : true, "Message" : error});
                      console.log("ERROR2");
                    }
                    if (numcount == numinvoices){
                        if (response.statusCode == 200 && data.code == 0){
                            res.json({"Error" : false, "Message" : "Success", "data" : userdata2});
                        } else {
                            res.json({"Error" : true, "Message" : userdata2.message});
                        }
                    }
                }
                request(options2, callback2);
            }
            
        }
    }
    request(options1, callback1);


});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/sales/commission
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.get("/api/sales/commission/plan", function (req, res) {
    var decoded = jwt.verify(req.cookies.jwt, jwt_key);

    var query = "select p.start_pct_of_plan, p.end_pct_of_plan, p.comm_pct, s.goal, s.start_date, s.end_date from sales_commissions_plan_table p inner join sales_user_commission s on p.plan_id = s.plan_id where s.user_id = ?;";
    var values = [decoded.id];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/aan_status
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/aan_status/", function (req, res) {
    var query = "select * from controller_log where log_type = 'AAN_STATS' and timestamp > (now() - INTERVAL 1 hour) order by timestamp desc;";
    query = mysql.format(query);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});


router.get("/api/aan_status/:hours", function (req, res) {
    var query = "select * from controller_log where log_type = 'AAN_STATS' and timestamp > (now() - INTERVAL ? hour) order by timestamp desc;";
    var values = [req.params.hours];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});


router.get("/api/aan_status/id/:controller_id/", function (req, res) {
    var query = "select * from controller_log where log_type = 'AAN_STATS' and timestamp > (now() - INTERVAL 1 hour) and controller_id = ? order by timestamp desc;";
    var values = [req.params.controller_id];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

router.get("/api/aan_status/id/:controller_id/:hours", function (req, res) {
    var query = "select * from controller_log where log_type = 'AAN_STATS' and timestamp > (now() - INTERVAL ? hour) and controller_id = ? order by timestamp desc;";
    var values = [req.params.hours, req.params.controller_id];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// api/control/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**********************************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get("/api/control/services", function (req, res) {
    var query = "select * from controller_log where log_type = 'CONTROL_STATS' order by timestamp desc limit 1;";
    query = mysql.format(query);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

router.get("/api/control/status_monitor", function (req, res) {
    var query = "select * from controller_log where log_type = 'SM_STATS' and timestamp > (now() - INTERVAL 1 hour)  order by timestamp desc;";
    query = mysql.format(query);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

router.get("/api/control/status_monitor/:hours", function (req, res) {
    var query = "select * from controller_log where log_type = 'SM_STATS' and timestamp > (now() - INTERVAL ? hour)  order by timestamp desc;";
    var values = [req.params.hours];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});


router.get("/api/control/services/id/:controller_id", function (req, res) {
    var query = "select * from controller_log where log_type = 'CONTROL_STATS' and controller_id = ? order by timestamp desc limit 1;";
    var values = [req.params.controller_id];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

router.get("/api/control/status_monitor/id/:controller_id", function (req, res) {
    var query = "select * from controller_log where log_type = 'SM_STATS' and controller_id = ? and timestamp > (now() - INTERVAL 1 hour)  order by timestamp desc;";
    var values = [req.params.controller_id];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

router.get("/api/control/status_monitor/id/:controller_id/:hours", function (req, res) {
    var query = "select * from controller_log where log_type = 'SM_STATS' and controller_id = ? and timestamp > (now() - INTERVAL ? hour)  order by timestamp desc;";
    var values = [req.params.controller_id, req.params.hours];
    query = mysql.format(query, values);
    connection.query(query, function(err,rows){
        if(err) {
            res.json({"Error" : true, "Message" : "Error executing MySQL query"});
        } else {
            if (rows.length == 0) {
                res.json({"Error" : true, "Message" : "No Rows Returned"});
            } else {
                return_value = []
                for (row in rows) {
                    json = JSON.parse(rows[row].message);
                    json.controller_id = rows[row].controller_id;
                    json.timestamp = rows[row].timestamp;
                    return_value.push(json);
                }
                res.json({"Error" : false, "Message" : "Success", "data" : return_value});
            }
        }
    });
});

module.exports = router;
