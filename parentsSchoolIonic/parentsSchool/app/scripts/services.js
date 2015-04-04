angular.module('parentsSchool.services', ['http-auth-interceptor'])
.factory('AuthenticationService', function($rootScope, user, $http, $q, authService, $httpBackend, $location) {
  var baseUrl = 'http://localhost\:9000';
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
      $http
      .post(loginEndpoint, user)
      .success(function (data, status, headers, config) {
        $http.defaults.headers.common.Authorization = "Bearer "+data.token;
/*        var prevUserUid = localStorage.getItem('uid') || '';
        if(prevUserUid && (prevUserUid != data.user.uid)) {
          localStorage.removeItem('userSites'+prevUserUid);
          localStorage.removeItem('localData');
        }*/
        console.log("UserData from server:", data);
        $rootScope.user = data;
        localStorage.setItem('uid', data._id);
        localStorage.setItem('user', JSON.stringify(data));
        console.log('Login data form server:', data);
        localStorage.setItem('token', data.token);

        authService.loginConfirmed(data, function(config) { 
          config.headers.Authorization = "Bearer "+data.token;
          return config;
        });
      })
      .error(function (data, status, headers, config) {
        $rootScope.$broadcast('event:auth-login-failed', status);
        var error = "Login failed.";
        if (status == 401) {
          error = "Invalid Username or Password.";
        } else if (status == 404) {
          error = "Backend is not configured properly"; 
        }
      });
    },
    logout: function(user) {
      $http.post(logoutEndpoint, {}, { ignoreAuthModule: true })
      .finally(function(data) {
        delete $http.defaults.headers.common.Authorization;
        $rootScope.$broadcast('event:auth-logout-complete');
      });			
    },	
    loginCancelled: function() {
      authService.loginCancelled();
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
