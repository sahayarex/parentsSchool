angular.module('starter.services', [])
.factory('MyService', function($rootScope, $ionicPopup, $state, $http, $q, $httpBackend, $location) {
  var baseUrl = 'http://192.168.1.3\:9000';
  //var baseUrl = 'http://localhost\:9000';
  var loginEndpoint       = baseUrl +'/api/users/verify';
  var logoutEndpoint       = baseUrl +'/api/users/';
  var token = localStorage.getItem('token') || '';
  if(token) {
    $http.defaults.headers.common.Authorization = "Bearer "+token;
  }
  
  var service = {
    login: function(user) {
      var defer = $q.defer();
      $http
      .post(loginEndpoint, user)
      .success(function (data, status, headers, config) {
        console.log("status:", status);
        if(data.status == "password not matching") {
          var alertPopup = $ionicPopup.alert({
              title: 'Login failed!',
              template: 'Password not matching'
          });
        } else {
          $http.defaults.headers.common.Authorization = "Bearer "+data.token;
          console.log("UserData from server:", data);
          user = data;
          localStorage.setItem('token', data.token);
          delete data.token;
          localStorage.setItem('uid', data._id);
          localStorage.setItem('user', JSON.stringify(data));
          defer.resolve(data);
        }
      })
      .error(function (data, status, headers, config) {
        defer.reject(status);
        console.log("status", status);
        var alertPopup = $ionicPopup.alert({
          title: 'Login failed!',
          template: 'Please check your credentials!'
        });
      });
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
      console.log("student params", student);
      var type = student.typeofexam;
      if(student.typeofexam % 1 === 0) {
        type = user.typeofexams[student.typeofexam];
      }
      $http.get(baseUrl+'/api/marks/'+student.schoolid+'/'+student.year+'/'+type+'/'+student.studentid+'/'+student.standard+'/'+student.division)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getUsers: function(userdata) {
      var defer = $q.defer();
      if(!userdata.standard)
        userdata.standard = "all";
      if(!userdata.division)
        userdata.division = "all";
      if(!userdata._id) {
        userdata._id = "all";
      }
      $http.get(baseUrl+'/api/users/'+userdata.schoolid+'/'+userdata.standard+'/'+userdata.division+'/'+userdata._id)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },            
    online: function() {
      return true;
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
    charts: function(marks, chartlist) {
    	var allcharts = {};
    	console.log("user in chart service", user);
    	var updateditems = subjectMarks = subjectLabels = gradeLabels = subjectDataPass = subjectDataFail = toppers = [];  
  		var pass = fail = attendanceVal = totalrecords = 0;
		var gradeData = j = [];
		angular.forEach(marks, function(v,k) {
		    var subjects = user.subjects;
		    var marks = v.marks;
			if(v.status == "Pass")
			  pass++;
			if(v.status == "Fail")
			  fail++;
			if(toppers[v.standard]) {
			if(toppers[v.standard].total < v.total) {
			  toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
			}
			} else {
			toppers[v.standard] = {student: v.student, standard: v.standard, division: v.division, total: v.total};
			}
			marks.forEach(function(mv, mk) {
			angular.forEach(mv, function(mvv, mkk) {
			  if(subjects.indexOf(mkk) > -1) {
			    subjectDataPass[mkk] = (subjectDataPass[mkk]) ? subjectDataPass[mkk] : 0;
			    subjectDataFail[mkk] = (subjectDataFail[mkk]) ? subjectDataFail[mkk] : 0;   
			    if(mvv >= user.passmark) {
			      subjectDataPass[mkk]++;
			    } else {
			      subjectDataFail[mkk]++;
			    }
			  }
			})
			})

			gradeLabels = [];
			for (var i = 0; i < user.grades.length; i++) {
			j[i] = (j[i]) ? j[i] : 0;
			if(user.grades[i].grade == v.grade) {
			    j[i]++;
			}
			gradeLabels[i] = user.grades[i].grade;
			};
			gradeData = j;
			if(attendanceVal > 0) {
			attendanceVal = parseInt(v.attendance);
			} else {
			attendanceVal = attendanceVal + parseInt(v.attendance);
			}
		})
		applyMarks();
    }
  };
  return service;
})
angular.module('underscore', []).factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});