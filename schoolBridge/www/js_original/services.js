angular.module('parentsSchool.services', [])
.factory('AuthenticationService', function($rootScope, $state, $http, $q, $httpBackend, $location) {
  var baseUrl = 'http://192.168.1.3\:9000';
  //var baseUrl = 'http://axis.moolah.co.in';
  var loginEndpoint       = baseUrl +'/api/users/verify';
  var logoutEndpoint       = baseUrl +'/api/users/';
  /*var token = localStorage.getItem('token') || '';
  if(token) {
    $http.defaults.headers.post['X-CSRF-TOKEN']= token;  
  }
  */
  var service = {
    login: function(user) {
      var defer = $q.defer();
      $http
      .post(loginEndpoint, user)
      .success(function (data, status, headers, config) {
        $http.defaults.headers.common.Authorization = "Bearer "+data.token;
        console.log("UserData from server:", data);
        $rootScope.user = data;
        localStorage.setItem('uid', data._id);
        localStorage.setItem('user', JSON.stringify(data));
        console.log('Login data form server:', data);
        defer.resolve(data);
/*        authService.loginConfirmed(data, function(config) { 
          config.headers.Authorization = "Bearer "+data.token;
          return config;
        });*/
      })
      .error(function (data, status, headers, config) {
        //$rootScope.$broadcast('event:auth-login-failed', status);
        defer.reject(status);
/*        var error = "Login failed.";
        if (status == 401) {
          error = "Invalid Username or Password.";
        } else if (status == 404) {
          error = "Backend is not configured properly"; 
        }
*/      });
        return defer.promise;
    },
    logout: function(user) {
      var defer = $q.defer();
      $http.post(logoutEndpoint, {})
      .success(function(data, status, headers, config) {
        delete $http.defaults.headers.common.Authorization;
        defer.resolve(data);
      })
      .error(function(data, status, headers, config) {
        defer.reject(data);
      });
      return defer.promise;			
    },	
    saveMarks: function(marks) {
      console.log("Marks", marks);
      var defer = $q.defer();
      $http.post(baseUrl+'/api/marks', marks)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    updateMarks: function(marks) {
      console.log("update marks:", marks);
      var defer = $q.defer();
      $http.post(baseUrl+'/api/marks/'+marks._id, marks)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },    
    getMarks: function(student) {
      var defer = $q.defer();
      $http.get(baseUrl+'/api/marks/'+student.year+'/'+student.typeofexam+'/'+student.studentid)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },            
    online: function() {
      if(navigator.platform == "Linux x86_64") {
        return true;
      }

      var networkState = navigator.connection.type;
      var states = {};
      states[Connection.UNKNOWN] = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI] = 'WiFi connection';
      states[Connection.CELL_2G] = 'Cell 2G connection';
      states[Connection.CELL_3G] = 'Cell 3G connection';
      states[Connection.CELL_4G] = 'Cell 4G connection';
      states[Connection.NONE] = 'No network connection';
      if (states[networkState] == 'No network connection') {
        return false;
      }
      else {
        return true;
      }
    },
    baseUrl: baseUrl
  };
  return service;
})
