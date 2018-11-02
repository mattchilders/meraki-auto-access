var app = angular.module('adminApp', ['ui.router', "ui.bootstrap", 'ngAnimate', 'smart-table']);
app.constant('ENDPOINT_URI', '/api/');

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $stateProvider
    .state('portprofiles', {
      url: '/portprofiles',
      views: {
        'navbar' : {
          templateUrl: '/app/partials/navbar.html'        },
        'portprofiles' : {
          templateUrl: '/app/partials/portprofiles.html',
          controller: 'portProfileController'
        }
      }
    })
    .state('portconnectchecks', {
      url: '/portconnectchecks',
      views: {
        'navbar' : {
          templateUrl: '/app/partials/navbar.html'        },
        'portconnectchecks' : {
          templateUrl: '/app/partials/portconnectchecks.html',
          controller: 'portConnectChecksController'
        }
      }
    })
    .state('intro', {
      url: '',
      views: {
        'navbar' : {
          templateUrl: '/app/partials/navbar.html'        },
        'intro' : {
          templateUrl: '/app/partials/intro.html',
          controller: 'introController'
        }
      }
    })
    .state('settings', {
      url: '/settings',
      views: {
        'navbar' : {
          templateUrl: '/app/partials/navbar.html'        },
        'settings' : {
          templateUrl: '/app/partials/settings.html',
          controller: 'settingsController'
        }
      }
    })
});