// Ionic Starter App
var user = {};
var db = null;
var filtersData = {};
var educationyear = '';
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova', 'chart.js', 'starter.controllers'])

.run(function($ionicPlatform, $cordovaSQLite) {
  $ionicPlatform.ready(function() {
    if(window.cordova) {
      db = $cordovaSQLite.openDB({ name: "mytest.db" });
    } else {
      db = window.openDatabase("mytest.db", "1.0", "my test data", 200000);
    }
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS marks (id integer primary key, _id text, student text, studentid text, school text, schoolid text, typeofexam text, marks blob, total integer, percentage integer, grade text, attendance text, status text, year integer, educationyear text, subjects blob, teacher text, teacherid text, standard text, division text, created integer, action text)");

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})
.directive('initialize', function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '',
    link: function(scope, elem, attrs) {
      elem.bind('click', function() {
        console.log("INITIALIZE: ", scope.link);
        if(scope.link.title == "Dashboard") {
          scope.filterResults();
        }
      });
    }
  };
})
.directive('ionSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            getData: '&source',
            model: '=?',
            search: '=?filter'
        },
        link: function(scope, element, attrs) {
            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || '';
            scope.search = {value: ''};
            if (attrs.class)
                element.addClass(attrs.class);

            if (attrs.source) {
                scope.$watch('search.value', function (newValue, oldValue) {
                  console.log('newValue', newValue);
                  console.log('oldValue', oldValue);
                    if (newValue.length > attrs.minLength) {
                        scope.getData({str: newValue}).then(function (results) {
                            scope.model = results;
                        });
                    } else {
                        scope.model = [];
                    }
                });
            }

            scope.clearSearch = function() {
                scope.search.value = '';
            };
        },
        template: '<div class="item-input-wrapper">' +
                    '<i class="icon ion-android-search"></i>' +
                    '<input type="search" placeholder="{{placeholder}}" ng-model="search.value">' +
                    '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                  '</div>'
    };
})

.config(function($stateProvider, $ionicConfigProvider, $urlRouterProvider) {

  $stateProvider
  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })
 .state('app.dashboard', {
    url: "/dashboard",
    views: {
      'menuContent' :{
        templateUrl: "templates/dashboard.html",
        controller: 'DashboardCtrl'
      }
    }
  })
 .state('app.dashboardFilters', {
    url: "/dashboard/:year/:typeofexam",
    views: {
      'menuContent' :{
        templateUrl: "templates/dashboard.html",
        controller: 'DashboardCtrl'
      }
    }
  })
  .state('app.allstudents', {
    url: "/allstudents",
    views: {
      'menuContent' :{
        templateUrl: "templates/allstudents.html",
        controller: 'AllStudentsCtrl'
      }
    }
  })
 .state('app.allstudentsFilters', {
    url: "/allstudents/:year/:typeofexam",
    views: {
      'menuContent' :{
        templateUrl: "templates/allstudents.html",
        controller: 'AllStudentsCtrl'
      }
    }
  })           
 .state('app.studentDashboard', {
    url: "/studentdashboard/:year/:typeofexam/:studentid",
    views: {
      'menuContent' :{
        templateUrl: "templates/studentdashboard.html",
        controller: 'StudentDashboardCtrl'
      }
    }
  })   
 .state('app.marks', {
    url: "/marks",
    views: {
      'menuContent' :{
        templateUrl: "templates/marks.html",
        controller: 'MarksCtrl'
      }
    }
  })   
  .state('app.students', {
    url: "/marks/:year/:typeofexam",
    views: {
      'menuContent' :{
        templateUrl: "templates/students.html",
        controller: 'StudentsCtrl'
      }
    }
  })    
  .state('app.entermarks', {
    url: "/marks/:year/:typeofexam/:studentid",
    views: {
      'menuContent' :{
        templateUrl: "templates/entermarks.html",
        controller: 'EnterMarksCtrl'
      }
    }
  })
  .state('app.updatemarks', {
    url: "/marks/:year/:typeofexam/:studentid/:action",
    views: {
      'menuContent' :{
        templateUrl: "templates/updatemarks.html",
        controller: 'UpdateMarksCtrl'
      }
    }
  })    

  .state('home', {
    url: '/home',
    templateUrl: 'templates/home.html',
    controller: 'LoginCtrl'
  })
  .state('logout', {
      url: '/home',
      templateUrl: 'templates/home.html',
      controller: 'LogoutCtrl'
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/home');
});
