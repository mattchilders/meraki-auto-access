/**************************************************************************************/
/**************************************************************************************/
//IntroController
/**************************************************************************************/
/**************************************************************************************/
app.controller('introController', function ($scope, $stateParams) {

});


/**************************************************************************************/
/**************************************************************************************/
//SettingsController
/**************************************************************************************/
/**************************************************************************************/
app.controller('settingsController', function ($scope, $stateParams, settingsModel) {
  $scope.apikey = '';
  $scope.secret = '';

    $scope.updateKeys = function() {
    data = {"apikey": $scope.apikey, "secret": $scope.secret}
    settingsModel.update(data)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.settingsSuccess = "Keys and Secret updated successfully"
          $scope.settingsError = undefined
          $scope.editedPortProfile = "";
        } else {
          $scope.settingsSuccess = undefined
          $scope.settingsError = "Error updating keys: " + retval.Message
        }
      });
  }

});


/**************************************************************************************/
/**************************************************************************************/
//NavbarController
/**************************************************************************************/
/**************************************************************************************/
app.controller('NavbarController', function ($scope, $location, $stateParams) {
    $scope.isNavCollapsed = true;
    $scope.isCollapsed = false;
    $scope.isCollapsedHorizontal = false;
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) == path) {
            return true
        } else {
            return false;
        }
    };
});



/**************************************************************************************/
/**************************************************************************************/
//portProfileController
/**************************************************************************************/
/**************************************************************************************/
app.controller('portProfileController', function ($scope, $stateParams, portProfileModel, portConnectChecksModel) {

  $scope.itemsByPage = {'selected': 25, 'options': [10, 25, 50, 100]}

  $scope.porttypes = ['trunk', 'access']
  $scope.poe = ['enabled', 'disabled']
  $scope.rstp = ['enabled', 'disabled']
  $scope.isolation = ['enabled', 'disabled']
  $scope.stpguard = ['disabled', 'BPDU guard', 'Root guard', 'Loop guard']

  convert_true_false = function(value) {
    if (value == 'enabled') {
      return true;
    }
    if (value == 'disabled') {
      return false;
    }
    return undefined;
  }
  $scope.convert_true_false = convert_true_false;

  convert_enabled_disabled = function(value) {
    if (value == "true" || value == true) {
      return "enabled";
    }
    if (value == "false" || value == false) {
      return "disabled";
    }
    return undefined;
  }
  $scope.convert_enabled_disabled = convert_enabled_disabled;

  $scope.getPortProfiles = function() {
     $scope.portProfiles = [];
     portProfileModel.get()
       .then(function (result) {
         $scope.portProfiles = result.data.data;
       });
  }

  $scope.initializePortProfile = function() {
    $scope.newPortProfile = {'name': '', 'porttype': 'access', 'vlan': '1', 'allowedvlans': '1-4094', 'voicevlan': '', 'tags': '', 'poe': 'enabled', 'isolation': 'disabled', 'rstp': 'enabled', 'stpguard': 'BPDU guard', 'accesspolicynum': ''}
  }

  $scope.createPortProfile = function(portprofile) {
    newprofile = {}
    newprofile.enabled = "true"
    newprofile.name = portprofile.name
    newprofile.porttype = portprofile.porttype
    newprofile.vlan = portprofile.vlan
    if (newprofile.porttype == "trunk") {
      newprofile.allowedvlans = portprofile.allowedvlans
      newprofile.voicevlan = ""
    }
    if (newprofile.porttype == "access") {
      newprofile.voicevlan = portprofile.voicevlan
      newprofile.allowedvlans = ""
    }
    newprofile.tags = portprofile.tags
    newprofile.poe = convert_true_false(portprofile.poe)
    newprofile.isolation = convert_true_false(portprofile.isolation)
    newprofile.rstp = convert_true_false(portprofile.rstp)
    if (newprofile.rstp == true) {
      newprofile.stpguard = portprofile.stpguard
    } else {
      newprofile.stpguard = ""
    }
    newprofile.accesspolicynum = portprofile.accesspolicynum
    portProfileModel.create(newprofile)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortProfiles();
          $scope.initializePortProfile();
          $scope.createPortProfileError = undefined
          $('#newPortProfile').modal('hide');
        } else {
          $scope.createPortProfileError = retval.Message
        }
      });
  }

  $scope.setDeletedPortProfile = function(profile) {
    $scope.deletedPortProfile = profile;
  }

  $scope.deletePortProfile = function(id) {
    portProfileModel.delete(id)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortProfiles();
          $scope.deletePortProfileError = undefined;
          $('#deletePortProfile').modal('hide');
        } else {
          $scope.deletePortProfileError = retval.Message;
        }
      });
  }

  $scope.setEditedPortProfile = function(profile) {
    $scope.editedPortProfile = angular.copy(profile);
    $scope.editedPortProfile.poe = convert_enabled_disabled($scope.editedPortProfile.poe)
    $scope.editedPortProfile.isolation = convert_enabled_disabled($scope.editedPortProfile.isolation)
    $scope.editedPortProfile.rstp = convert_enabled_disabled($scope.editedPortProfile.rstp)
  }

  $scope.cancelEditing = function() {
    $scope.editedPortProfile = "";
  }

  $scope.updatePortProfile = function(portprofile) {
    newprofile = {}
    newprofile.id = portprofile.id
    newprofile.enabled = "true"
    newprofile.name = portprofile.name
    newprofile.porttype = portprofile.porttype
    newprofile.vlan = portprofile.vlan
    if (newprofile.porttype == "trunk") {
      newprofile.allowedvlans = portprofile.allowedvlans
      newprofile.voicevlan = ""
    }
    if (newprofile.porttype == "access") {
      newprofile.voicevlan = portprofile.voicevlan
      newprofile.allowedvlans = ""
    }
    newprofile.tags = portprofile.tags
    newprofile.poe = convert_true_false(portprofile.poe)
    newprofile.isolation = convert_true_false(portprofile.isolation)
    newprofile.rstp = convert_true_false(portprofile.rstp)
    if (newprofile.rstp == true) {
      newprofile.stpguard = portprofile.stpguard
    } else {
      newprofile.stpguard = ""
    }
    newprofile.accesspolicynum = portprofile.accesspolicynum
    portProfileModel.update(newprofile.id, newprofile)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortProfiles();
          $scope.editPortProfileError = undefined
          $('#editPortProfile').modal('hide');
          $scope.editedPortProfile = "";
        } else {
          $scope.editPortProfileError = retval.Message
        }
      });
  }

  $scope.getPortProfiles();
  $scope.initializePortProfile();


});


/**************************************************************************************/
/**************************************************************************************/
//portConnectChecksController
/**************************************************************************************/
/**************************************************************************************/
app.controller('portConnectChecksController', function ($scope, $stateParams, portProfileModel, portConnectChecksModel) {

  $scope.itemsByPage = {'selected': 25, 'options': [10, 25, 50, 100]}

  $scope.checktypes = ['cdp', 'lldp', 'mac'];


  $scope.getPortProfiles = function() {
     $scope.portProfiles = [];
     $scope.defaultProfiles = ['None'];
     portProfileModel.get()
       .then(function (result) {
         $scope.portProfiles = result.data.data;
         var newprofiles = [];
         for (id in $scope.portProfiles){
            newprofiles.push( $scope.portProfiles[id].name)
            $scope.defaultProfiles.push($scope.portProfiles[id].name)
         }
         $scope.portProfiles = newprofiles
       });
  }

  $scope.getPortProfileDefault = function() {
    portConnectChecksModel.get_defaults()
      .then(function(result) {
        $scope.default_rule = result.data.data[0].portprofile;
      });
  }

  $scope.getPortConnectChecks = function() {
     $scope.portConnectChecks = [];
     portConnectChecksModel.get()
       .then(function (result) {
          $scope.portConnectChecks = result.data.data;
          $scope.next_rule = 0;
          $scope.new_rule_orders = []
          $scope.existing_rule_orders = []
          for (i in $scope.portConnectChecks) {
            $scope.new_rule_orders.push($scope.portConnectChecks[i].rule_order);
            $scope.existing_rule_orders.push($scope.portConnectChecks[i].rule_order);
            if ($scope.next_rule < $scope.portConnectChecks[i].rule_order) {
              $scope.next_rule = $scope.portConnectChecks[i].rule_order;
            }
          };
          $scope.new_rule_orders.push($scope.next_rule + 1);
          $scope.initializePortConnectCheck()
       });
  }

  $scope.initializePortConnectCheck = function() {
    $scope.newPortConnectCheck = {'checktype': '', 'regstring': '', 'portprofile': '', 'rule_order': $scope.next_rule + 1}
  }

  $scope.createPortConnectCheck = function(portconnectcheck) {
    //portconnectcheck.portprofile = portconnectcheck['portprofile']['name'];

    portConnectChecksModel.create(portconnectcheck)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortConnectChecks();
          $scope.initializePortConnectCheck();
          $scope.createPortConnectCheckError = undefined
          $('#newPortConnectCheck').modal('hide');
        } else {
          $scope.createPortConnectCheckError = retval.Message
        }
      });
  }

  $scope.setDeletedPortConnectCheck = function(portconnectcheck) {
    $scope.deletedPortConnectCheck = portconnectcheck;
    console.log($scope.deletedPortConnectCheck)
  }

  $scope.deletePortConnectCheck = function(id) {

    portConnectChecksModel.delete(id)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortConnectChecks();
          $scope.createPortConnectCheckError = undefined;
          $('#deletePortConnectCheck').modal('hide');
        } else {
          $scope.deletePortConnectChecksError = retval.Message;
        }
      });
  }

  $scope.updatePortConnectCheck = function(portconnectcheck) {
    portConnectChecksModel.update(portconnectcheck.id, portconnectcheck)
      .then(function (result) {
        retval = result.data;
        if (retval.Error == false) {
          $scope.getPortConnectChecks();
          $scope.editPortConnectCheckError = undefined
          $('#editPortConnectCheck').modal('hide');
        } else {
          $scope.editPortConnectCheckError = retval.Message
        }
      });
  }

  $scope.setEditedPortConnectCheck = function(portconnectcheck) {
    console.log(portconnectcheck);
    $scope.editedPortConnectCheck = angular.copy(portconnectcheck);;
    console.log($scope.editedPortConnectCheck.portprofile);
  }

  $scope.cancelEditing = function(portconnectcheck) {
    $scope.editedPortConnectCheck = portconnectcheck;

  }

  $scope.updateDefaultPortProfile = function(portprofile) {
    portConnectChecksModel.update_defaults({"portprofile": portprofile})
      .then(function (result) {
        retval = result.data;
        $scope.getPortProfileDefault();
      });
  }

  $scope.getPortConnectChecks();
  $scope.getPortProfiles();
  $scope.getPortProfileDefault();
  //$scope.initializePortConnectCheck();


});