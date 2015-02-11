'use strict';
// Ionic Starter App, v0.9.20

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('ParentsSchool', ['ionic', 'config', 'ParentsSchool.services', 'ParentsSchool.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
              scope.$apply(function (){
                  scope.$eval(attrs.ngEnter);
              });
              event.preventDefault();
            }
        });
    };
})

.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
})

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})

.directive('clickOnce', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var replacementText = attrs.clickOnce;

            element.bind('click', function() {
                $timeout(function() {
                    if (replacementText) {
                        element.html(replacementText);
                    }
                    element.attr('disabled', true);
                }, 0);
            });
        }
    };
})

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })
   .state('app.pages', {
      url: "/pages",
      views: {
        'menuContent' :{
          templateUrl: "templates/pages.html",
          controller: 'PagesCtrl'
        }
      }
    })
    .state('app.page', {
      url: "/page/:pageId",
      views: {
        'menuContent' :{
          templateUrl: "templates/page.html",
          controller: 'PageCtrl'
        }
      }
    })    
    .state('app.home', {
      url: "/home",
    views: {
        'menuContent' :{
            controller:  "HomeCtrl",
            templateUrl: "templates/home.html"              
        }
    }         
    })
    .state('app.createPage', {
      url: "/create-page",
    views: {
        'menuContent' :{
            controller:  "CreatePageCtrl",
            templateUrl: "templates/create-page.html"              
        }
    }         
    })    
    .state('app.entries-today', {
      url: "/entries-today",
    views: {
        'menuContent' :{
            controller:  "EntriesTodayCtrl",
            templateUrl: "templates/entries-today.html"              
        }
    }         
    })
    .state('app.logout', {
      url: "/logout",
      views: {
         'menuContent' :{
           controller: "LogoutCtrl"
          }
      } 
    });
  $urlRouterProvider.otherwise("/app/home");

});

