#!/usr/bin/env node
var express = require('express');
var app = express();
var http = require('http');
var sqlite3 = require('sqlite3')
var bodyParser = require('body-parser')
var ps = require('python-shell');
var request = require('request');

const nacl = require('tweetnacl')
const utils = require('tweetnacl-util')
const encodeBase64 = utils.encodeBase64
var sha512 = require('js-sha512').sha512;

var fs = require('fs');
var randomstring = require("randomstring");
 

let db = new sqlite3.Database('./db/merakihooks.sqlite', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
}); 

var secureServer = http.createServer(app).listen(8891);

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit:50000}));

app.use('/', express.static(__dirname + '/gui'));


/****************************************************************************************************************************************** 
******************************************************************************************************************************************* 
      __         _     __               _                    __ _ _           
     / /        (_)   / /              | |                  / _(_) |          
    / /_ _ _ __  _   / / __   ___  _ __| |_ _ __  _ __ ___ | |_ _| | ___  ___ 
   / / _` | '_ \| | / / '_ \ / _ \| '__| __| '_ \| '__/ _ \|  _| | |/ _ \/ __|
  / / (_| | |_) | |/ /| |_) | (_) | |  | |_| |_) | | | (_) | | | | |  __/\__ \
 /_/ \__,_| .__/|_/_/ | .__/ \___/|_|   \__| .__/|_|  \___/|_| |_|_|\___||___/
          | |         | |                  | |                                
          |_|         |_|                  |_|                
******************************************************************************************************************************************
******************************************************************************************************************************************/


app.get("/api/portprofiles",function(req,res){
    var query = "SELECT * FROM portprofiles;";
    db.all(query, [], (err, rows) => {
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


app.post("/api/portprofiles",function(req,res){
	var params  = req.body;
	console.log(params);
    var insert = "INSERT INTO portprofiles (name, tags, enabled, poe, porttype, vlan, voicevlan, isolation, rstp, stpguard, accesspolicynum, allowedvlans) \
                  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
    var values = [];
    values.push(params['name']);
    values.push(params['tags']);
    values.push(params['enabled']);
    values.push(params['poe']);
    values.push(params['porttype']);
    values.push(params['vlan']);
    values.push(params['voicevlan']);
    values.push(params['isolation']);
    values.push(params['rstp']);
    values.push(params['stpguard']);
    values.push(params['accesspolicynum']);
    values.push(params['allowedvlans']);
    console.log(insert);
    console.log(values);
    db.all(insert, values, (err, rows) => {
        if(err) {
        	console.log(err);
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : this.lastID});
        }
    });
});


app.put("/api/portprofiles/:id",function(req,res){
	var params  = req.body;
	var id = req.params.id
    var update = "UPDATE portprofiles set name = ?, tags = ?, enabled = ?, poe = ?, porttype = ?, vlan = ?, voicevlan = ?, isolation = ?, rstp = ?, stpguard= ?, \
    			  accesspolicynum = ?, allowedvlans = ? where id = ?;"
    var values = [];
    values.push(params['name']);
    values.push(params['tags']);
    values.push(params['enabled']);
    values.push(params['poe']);
    values.push(params['porttype']);
    values.push(params['vlan']);
    values.push(params['voicevlan']);
    values.push(params['isolation']);
    values.push(params['rstp']);
    values.push(params['stpguard']);
    values.push(params['accesspolicynum']);
    values.push(params['allowedvlans']);
    values.push(id);
    console.log(update);
    console.log(values);
    db.all(update, values, (err, rows) => {
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : this.lastID});
        }
    });
});


app.delete("/api/portprofiles/:id",function(req,res){
	var id = req.params.id
	var del = "DELETE FROM portprofiles where id = ?;"
	db.all(del, [id], (err, rows) => {
        if(err) {
        	console.log(err);
            res.json({"Error" : true, "Message" : err});
        } else {
        	console.log("Deleted port profile " + id + rows);
            res.json({"Error" : false, "Message" : "Success"});
        }
    });
});




/****************************************************************************************************************************************** 
******************************************************************************************************************************************* 
      __         _     __               _                                  _       _               _        
     / /        (_)   / /              | |                                | |     | |             | |       
    / /_ _ _ __  _   / / __   ___  _ __| |_ ___ ___  _ __  _ __   ___  ___| |_ ___| |__   ___  ___| | _____ 
   / / _` | '_ \| | / / '_ \ / _ \| '__| __/ __/ _ \| '_ \| '_ \ / _ \/ __| __/ __| '_ \ / _ \/ __| |/ / __|
  / / (_| | |_) | |/ /| |_) | (_) | |  | || (_| (_) | | | | | | |  __/ (__| || (__| | | |  __/ (__|   <\__ \
 /_/ \__,_| .__/|_/_/ | .__/ \___/|_|   \__\___\___/|_| |_|_| |_|\___|\___|\__\___|_| |_|\___|\___|_|\_\___/
          | |         | |                                                                                   
          |_|         |_|                                                                                   
******************************************************************************************************************************************
******************************************************************************************************************************************/


app.get("/api/portconnectchecks",function(req,res){
    var query = "SELECT * FROM portconnectchecks;";
    db.all(query, [], (err, rows) => {
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : rows});
        }
    });
});


app.post("/api/portconnectchecks",function(req,res){
	var params  = req.body;
	console.log(params);
    var insert = "INSERT INTO portconnectchecks (checktype, regstring, portprofile) \
                  VALUES(?, ?, ?);"
    var values = [];
    values.push(params['checktype']);
    values.push(params['regstring']);
    values.push(params['portprofile']);
    console.log(insert);
    console.log(values);
    db.all(insert, values, (err, rows) => {
        if(err) {
        	console.log(err);
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : this.lastID});
        }
    });
});


app.put("/api/portconnectchecks/:id",function(req,res){
	var params  = req.body;
	var id = req.params.id
    var update = "UPDATE portconnectchecks set checktype = ?, regstring = ?, portprofile = ? where id = ?;"
    var values = [];
    values.push(params['checktype']);
    values.push(params['regstring']);
    values.push(params['portprofile']);
    values.push(id);
    console.log(update);
    console.log(values);
    db.all(update, values, (err, rows) => {
        if(err) {
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success", "data" : this.lastID});
        }
    });
});


app.delete("/api/portconnectchecks/:id",function(req,res){
	var id = req.params.id
	var del = "DELETE FROM portconnectchecks where id = ?;"
	db.all(del, [id], (err, rows) => {
        if(err) {
        	console.log(err);
            res.json({"Error" : true, "Message" : err});
        } else {
        	console.log("Deleted port profile " + id + rows);
            res.json({"Error" : false, "Message" : "Success"});
        }
    });
});






/****************************************************************************************************************************************** 
******************************************************************************************************************************************* 
      __         _     __       _   _   _                 
     / /        (_)   / /      | | | | (_)                
    / /_ _ _ __  _   / /__  ___| |_| |_ _ _ __   __ _ ___ 
   / / _` | '_ \| | / / __|/ _ \ __| __| | '_ \ / _` / __|
  / / (_| | |_) | |/ /\__ \  __/ |_| |_| | | | | (_| \__ \
 /_/ \__,_| .__/|_/_/ |___/\___|\__|\__|_|_| |_|\__, |___/
          | |                                    __/ |    
          |_|                                   |___/ 
******************************************************************************************************************************************
******************************************************************************************************************************************/

app.put("/api/settings",function(req,res){
    var params  = req.body;

    // Our nonce must be a 24 bytes Buffer (or Uint8Array)
    const nonce = nacl.randomBytes(24)
    // Our secret key must be a 32 bytes Buffer (or Uint8Array) - so pad it with dots to make a 32 byte string
    const secretKey = Buffer.from(params['secret'].padEnd(32, '.'), 'utf8')
    // Make sure your data is also a Buffer of Uint8Array
    const secretData = Buffer.from(params['apikey'], 'utf8')
    const encrypted = nacl.secretbox(secretData, nonce, secretKey)
    // We can now store our encrypted result and our nonce somewhere
    const encrypted_api_key = `${encodeBase64(nonce)}:${encodeBase64(encrypted)}`
    
    var hash = sha512.create();
    hash.update(params['secret']);
    secret_hash = hash.hex();

    console.log(encrypted_api_key);
    console.log(secret_hash);

    var update = "UPDATE settings set apikey = ?, secret = ?;"
    var values = [encrypted_api_key, secret_hash];

    db.all(update, values, (err, rows) => {
        if(err) {
            console.log(err);
            res.json({"Error" : true, "Message" : err});
        } else {
            res.json({"Error" : false, "Message" : "Success"});
        }
    });
});


/****************************************************************************************************************************************** 
******************************************************************************************************************************************* 
     /\               ___.   .__                   __            
    / / __  _  __ ____\_ |__ |  |__   ____   ____ |  | __
   / /  \ \/ \/ // __ \| __ \|  |  \ /  _ \ /  _ \|  |/ /
  / /    \     /\  ___/| \_\ \   Y  (  <_> |  <_> )    <
 / /      \/\_/  \___  >___  /___|  /\____/ \____/|__|_ \
 \/                  \/    \/     \/                   \/ 
******************************************************************************************************************************************
******************************************************************************************************************************************/


app.post("/webhook",function(req,res){
    var body  = req.body;
    res.status(200);
    res.send();
    console.log(body);

    var rcv_secret = body.sharedSecret;
    var hash = sha512.create();
    hash.update(rcv_secret);
    var rcv_secret_hash = hash.hex();

    var query = "SELECT secret from settings;";

    db.all(query, [], (err, rows) => {
        if(err) {
            console.log(err);
        }
        if (rcv_secret_hash == rows[0].secret){
            var randomfname = randomstring.generate(8)
            fs.writeFile("/tmp/merakimsg_" + randomfname + ".json", JSON.stringify(body), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("FILE WRITTEN");
            });

            var options = {
                  mode: 'text',
                  pythonPath: '/usr/bin/python',
                  pythonOptions: ['-u'],
                  scriptPath: '/opt/meraki/web',
                  args: ["merakimsg_" + randomfname + ".json"]
                };
                
            ps.PythonShell.run('setport.py', options, function (err, results) {
                if (err){
                    console.log(err)
                }
                console.log(results);
            });

        } else {
            console.log("WRONG SECRET KEY RECEIVED");
        }
    });

});
