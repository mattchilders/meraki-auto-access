app.service('portProfileModel', function ($http, ENDPOINT_URI) {
  function getUrl() {
    path = 'portprofiles/';
    return ENDPOINT_URI + path;
  }

  function getUrlForId(id) {
    return getUrl(path) + id;
  }

  this.get = function () {
    return $http.get(getUrl());
  };

  this.create = function (profile) {
    return $http.post(getUrl(), profile);
  };

  this.update = function (id, profile) {
    return $http.put(getUrlForId(id), profile);
  };

  this.delete = function (id) {
    return $http.delete(getUrlForId(id));
  };
})


app.service('portConnectChecksModel', function ($http, ENDPOINT_URI) {
  function getUrl() {
    path = 'portconnectchecks/';
    return ENDPOINT_URI + path;
  }

  function getUrlForId(id) {
    return getUrl(path) + id;
  }

  this.get = function () {
    return $http.get(getUrl());
  };

  this.get_defaults = function () {
    return $http.get(ENDPOINT_URI + 'portconnectchecks/default');
  };

  this.create = function (checks) {
    return $http.post(getUrl(), checks);
  };

  this.update = function (id, checks) {
    return $http.put(getUrlForId(id), checks);
  };

  this.update_defaults = function (portprofile) {
    return $http.put(ENDPOINT_URI + 'portconnectchecks/update/default/', portprofile);
  };

  this.delete = function (id) {
    return $http.delete(getUrlForId(id));
  };
})


app.service('settingsModel', function ($http, ENDPOINT_URI) {
  function getUrl() {
    path = 'settings';
    return ENDPOINT_URI + path;
  }

  this.get = function () {
    return $http.get(getUrl());
  };

  this.update = function (data) {
    return $http.put(getUrl(), data);
  };
})
