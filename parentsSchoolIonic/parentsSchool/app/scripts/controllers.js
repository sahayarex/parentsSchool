angular.module('parentsSchool.controllers', ['parentsSchool.services'])

.controller('AppCtrl', function($scope, $rootScope, $state, AuthenticationService, $ionicSideMenuDelegate) {
  $scope.user = JSON.parse(localStorage.getItem('user')) || {};
  $scope.uid = localStorage.getItem('uid') || '';
  $scope.savingSiteDetails = false;
  $scope.authenticatedMenu = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"Marks", "href":"app.marks", "class":"ion-clipboard"},{"title":"log-out", "href":"app.logout", "class":"ion-log-out"}]};                            
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    localStorage.setItem('processing', 'No');
    $state.go('app.dashboard');
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }
  //Sync online
  setInterval(function() {
    var processing = localStorage.getItem('processing');
    if(processing != 'Yes') {
      if(AuthenticationService.online()) {
        var localData = JSON.parse(localStorage.getItem('localData')) || {};
        if(Object.keys(localData).length > 0) {
          angular.forEach(localData, function(monitor, key) {
            //console.log("Monitor", monitor);
            if(monitor.serverUpdate != 1) {
              localStorage.setItem('processing', 'Yes');
              AuthenticationService.saveMarks(monitor).then(function(data) {
                if(data._id) {
                  console.log("Created Data: ", data);
                  monitor.serverUpdate = 1;
                  monitor._id = data._id;
                  localData[key] = monitor;
                  localStorage.setItem('localData', JSON.stringify(localData));
                  localStorage.setItem('processing', 'No');
                }
              });
            } else {
              if(monitor.action == "update") {
                AuthenticationService.updateMarks(monitor).then(function(data) {
                  if(data._id) {
                    console.log("Updated Data: ", data);
                    monitor.action = "updated";
                    localData[key] = monitor;
                    localStorage.setItem('localData', JSON.stringify(localData));
                    localStorage.setItem('processing', 'No');
                  }
                });
              }
            }
          })
        }
      }
    }
  }, 3000);
console.log("page",$state.current.url.indexOf('dashboard'));
if($state.current.url.indexOf('dashboard') > -1) {
  console.log('filter available', $state);
  $scope.dashboard = true;
  $rootScope.dashboardFilters = {};
  $scope.years = ["2015","2014"];
  $scope.filterResult = function() {
    console.log("result", $rootScope.dashboardFilters);
    $ionicSideMenuDelegate.toggleRight();
    $state.go("app.dashboardFilters", {year: $scope.years[$rootScope.dashboardFilters.year], typeofexam: $scope.user.typeofexams[$rootScope.dashboardFilters.typeofexam]});
  }
}
 /* console.log("current state", $state.current);
  document.body.classList.add($state.current.url.replace(/\//g, ""));  
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
      console.log('fromState', fromState);
      console.log('toState', toState);
    document.body.classList.remove(fromState.url.replace(/\//g, ""));  
    document.body.classList.add(toState.url.replace(/\//g, ""));  

  });*/
})
.controller('DashboardCtrl', function($scope, $rootScope, $stateParams, AuthenticationService) {
  console.log("state Params", $stateParams);
  var user = JSON.parse(localStorage.getItem("user")) || {};
  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
  console.log("latest updated", latestUpdated);
  if(Object.keys($stateParams).length > 0) {
    $scope.params = $stateParams;
  } else {
    var year = new Date().getFullYear();
    if(Object.keys(latestUpdated).length > 0) {
      $scope.params = {year: latestUpdated.year, typeofexam: latestUpdated.typeofexam};
    } else {
      $scope.params = {year: year, typeofexam: user.typeofexams[0]};
    }
  }
  $scope.params.studentid = "all";
  $scope.dashboardStatus = "all";  
  $scope.statusLabels = ["Pass", "Fail"];
  var pass = 0;
  var fail = 0;
  var subjectMarks = [];
  var subjectLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];
  var gradeData = [];
  var gradeLabels = [];
  var attendanceVal = 0;
  AuthenticationService.getMarks($scope.params).then(function(studentMarks) {
    console.log("got marks man: ", studentMarks);
    if(studentMarks.length > 0) {
      $rootScope.filters = true;
      angular.forEach(studentMarks, function(v,k) {
        if(v.status == "Pass")
            pass++;
        if(v.status == "Fail")
            fail++;
        angular.forEach(v.subjects, function(vv, kk) {
          console.log("limit", user.passmark);
          console.log("subject", vv);
          console.log("subject val", v[vv]);
          if(parseInt(v[vv]) > user.passmark) {
            subjectDataPass[kk] = (subjectDataPass[kk]) ? subjectDataPass[kk] + 1 : 1;
            subjectDataFail[kk] = (subjectDataFail[kk]) ? subjectDataFail[kk] : 0;
          } else {
            subjectDataFail[kk] = (subjectDataFail[kk]) ? subjectDataFail[kk] + 1 : 1;
            subjectDataPass[kk] = (subjectDataPass[kk]) ? subjectDataPass[kk] : 0;
          }
          console.log("Item pass: ", subjectDataPass);
          console.log("Item fail: ", subjectDataFail);
        })
        angular.forEach(user.grades, function(gv, gk) {
          gradeData[gk] = (gradeData[gk]) ? gradeData[gk] : 0;
          gradeLabels[gk] = gv.grade;
          if(gv.grade == v.grade) {
            gradeData[gk] = gradeData[gk] + 1;
          }
        })
        if(attendanceVal > 0) {
          attendanceVal = parseInt(v.attendance);
        } else {
          attendanceVal = attendanceVal + parseInt(v.attendance);
        }
      })
/*      console.log("subjectLabels", subjectLabels);
      console.log("subjectPass", subjectDataPass);
      console.log("subjectFail", subjectDataFail);*/
      $scope.subjectSeries = ["Pass", "Fail"];
      $scope.subjectLabels = user.subjects;
      $scope.subjectData = [
        subjectDataPass,subjectDataFail
      ];
      $scope.statusData = [pass,fail];
      $scope.gradeData = [gradeData];
      $scope.gradeLabels = gradeLabels;
      var attendance = attendanceVal * (100/(studentMarks.length *100));
      $scope.attendanceLabels = ["Present", "Absent"];
      $scope.attendanceData = [attendance, 100 - attendance];
    } else {
      $scope.dashboardStatus = "empty";
      $rootScope.filters = false;
    }
  });



  $scope.onClick = function (points, evt) {
    console.log("event", evt);
    console.log("point", points);
  };
})
.controller('AllStudentsCtrl', function($scope) {
  $scope.query = {};
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.users = user.students;
  console.log("user", user);
})
.controller('MarksCtrl', function($scope, AuthenticationService) {
  var user = JSON.parse(localStorage.getItem("user")) || {};
  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
  if(user) {
    $scope.exams = user.typeofexams;
  }
  if(Object.keys(latestUpdated).length > 0) {
    $scope.year = latestUpdated.year;
  } else {
    $scope.year = new Date().getFullYear();
  }
})
.controller('StudentsCtrl', function($scope, $stateParams) {
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.typeofexam = $stateParams.typeofexam;
  $scope.year = $stateParams.year;
  var updated = JSON.parse(localStorage.getItem("updatedStudents")) || {};
  console.log("updated items:", updated);
  if(Object.keys(updated).length > 0) {
    if(updated[$stateParams.year][$stateParams.typeofexam]) {
      angular.forEach(user.students, function(v,k) {
        if(updated[$stateParams.year][$stateParams.typeofexam][v.id+"time"]) {
          v.id = updated[$stateParams.year][$stateParams.typeofexam][v.id+"time"];
          v.status = "done";
          v.action = "/update";
        }
      })
    }
  }
  console.log("students", user.students);
  $scope.students = user.students;
    
})
.controller('EnterMarksCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  console.log("State params: ", $stateParams);
  $scope.marks = {};
  $scope.allmarks = {};
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.subjects = user.subjects;
  angular.forEach(user.students, function(val, key) {
    if(val.id == $stateParams.studentid) {
      $scope.studentname = val.name;
    }
  });
  console.log("user", $scope.studentname);
  $scope.createMarks = function() {
    var localData = JSON.parse(localStorage.getItem('localData')) || {};
    var t = new Date();
    var time = t.getTime();
    var year = $stateParams.year;
    $scope.marks.teacherid = user._id;
    $scope.marks.teacher = user.name;
    $scope.marks.year = $stateParams.year;
    $scope.marks.typeofexam = $stateParams.typeofexam;
    $scope.marks.studentid = $stateParams.studentid;
    $scope.marks.student = $scope.studentname;
    $scope.marks.school = user.school;
    $scope.marks.standard = user.standard;
    $scope.marks.division = user.division;
    $scope.marks.subjects = user.subjects;
    $scope.marks.serverUpdate = 0;
    $scope.marks.created = time;
    console.log("before store: ", $scope.marks);
    localData[time] = $scope.marks;
    localStorage.setItem('localData',  JSON.stringify(localData));
    var allStudents = {};
    var allUpdated = JSON.parse(localStorage.getItem("updatedStudents")) || {};
    if(Object.keys(allUpdated).length > 0) {
      allStudents = allUpdated[year][$scope.marks.typeofexam];
    } else {
      allUpdated[year] = {};
      allUpdated[year][$scope.marks.typeofexam] = {};
    }
    allStudents[$scope.marks.studentid+"time"] = time;
    allUpdated[year][$scope.marks.typeofexam] = allStudents;
    localStorage.setItem("updatedStudents", JSON.stringify(allUpdated));
    localStorage.setItem("latestUpdated", JSON.stringify({year:year, typeofexam: $scope.marks.typeofexam}));
    $state.go("app.students", {year: year, typeofexam: $stateParams.typeofexam});
  }
})

.controller('UpdateMarksCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  console.log("State params: ", $stateParams);
  $scope.marks = {};
  var user = JSON.parse(localStorage.getItem("user")) || {};
  $scope.subjects = user.subjects;
  var time = new Date().getTime();
  var localData = JSON.parse(localStorage.getItem('localData')) || {};
  if(localData[$stateParams.studentid]) {
    time = $stateParams.studentid;    
    $scope.marks = localData[$stateParams.studentid];
    console.log("taken data from local:", $scope.marks);
  } else {  
    AuthenticationService.getMarks($stateParams).then(function(studentMarks) {
      console.log("No local data so requested server: ", studentMarks);
      $scope.marks = studentMarks[0];
    });
  }
  $scope.updateMarks = function() {
    console.log("before store: ", $scope.marks);
    if($scope.marks._id) {
      $scope.marks.action = "update";
    }
    localData[time] = $scope.marks;
    localStorage.setItem('localData',  JSON.stringify(localData));
    $state.go("app.students", {year:$stateParams.year, typeofexam: $stateParams.typeofexam});
  }
})

.controller('LoginCtrl', function($scope, $http, $state, AuthenticationService) {
  $scope.message = "";
  $scope.doingLogin = false;
  $scope.user = {
    email: 'teacher-a@school-a.com',
    password: 'password'
  };
  $scope.login = function() {
    if(($scope.user.email == null) || ($scope.user.password == null)) {
      alert('Please fill the fields');
    } else {
      $scope.doingLogin = true;
      AuthenticationService.login($scope.user);
    }
  };
  
  $scope.logout = function() {
    AuthenticationService.logout();
  };
 
  $scope.$on('event:auth-loginRequired', function(e, rejection) {
    //$scope.loginModal.show();
  });
 
  $scope.$on('event:auth-loginConfirmed', function() {
    $scope.email = null;
    $scope.password = null;
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    $state.go('app.dashboard', {}, {reload: true});
  });
  
  $scope.$on('event:auth-login-failed', function(e, status) {
    $scope.doingLogin = false;
    $scope.user.email = '';
    $scope.user.password = '';
  });
 
  $scope.$on('event:auth-logout-complete', function() {
    localStorage.removeItem('uid');
    localStorage.removeItem('userPages'+$scope.uid);
    localStorage.removeItem('localData');
    $state.go('app.home', {}, {reload: true, inherit: false});
  });
})
 
.controller('HomeCtrl', function($scope, $ionicViewService) {
  $ionicViewService.clearHistory();
})

.controller('LogoutCtrl', function($scope, $state) {
  localStorage.removeItem('uid');
  $state.go('app.home', {}, {reload: true, inherit: false});

})


.controller('PagesCtrl', function($scope, $state, AuthenticationService) {
 
  $scope.gettingData = true;
  $scope.emptyResults = false;


  var allData = function() {
    if(AuthenticationService.online()) {
      var param = {"uid":$scope.uid, "type":"drupalionic"}
      AuthenticationService.getNodes(param).then(function(data) {
        console.log(data.nodes);
          if(data.nodes != null || data.nodes != undefined) {
            $scope.gettingData = false;
            $scope.pages = data.nodes;
          } else {
            $scope.emptyResults = true;
          }
          $scope.$broadcast('scroll.refreshComplete');
          localStorage.setItem('userData'+$scope.uid, JSON.stringify(data.nodes));
      });
    } else {
      var userData = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};            $scope.gettingData = false;
      if(Object.keys(userData).length > 0) {
        $scope.gettingData = false;
        $scope.pages = userData;
      } else {
        $scope.emptyResults = true;
      }
    }
  }

  $scope.getData = function() {
    allData();
  }

  $scope.remove = function(nid) {
    if(AuthenticationService.online()) {
      var userData = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};            $scope.gettingData = false;
      var node = userData[nid];
      console.log('node', node);
      if(node.nid) {
        AuthenticationService.removeNodeInServer(node.nid).then(function(data) {
          delete userData[nid];
          localStorage.setItem('userData'+$scope.uid, JSON.stringify(userData));
          allData();
        });
      } else {
        delete userData[nid];
        localStorage.setItem('userData', JSON.stringify(userData));
        allData();
      }
    } else {      
      delete userData[nid];
      localStorage.setItem('userData', JSON.stringify(userData));
      allData();
    }
  }

})

.controller('PageCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  var pages = JSON.parse(localStorage.getItem('userData'+$scope.uid)) || {};
  console.log('pages', pages.nodes);
  if(Object.keys(pages).length > 0) {
    $scope.page = pages.nodes[$stateParams.pageId];
    $scope.nid = $stateParams.pageId;
    console.log($scope.page);
  }

})

.controller('CreatePageCtrl', function($scope, $state, $stateParams, AuthenticationService) {
  $scope.page = {};
  $scope.page.uid = $scope.uid;
  $scope.page.nid = '';
  $scope.page.type = 'drupalionic';
  $scope.page.serverUpdate = 0;
  //We store the values in local and sync the data
  //In this way we can let the users submit data offline.
  $scope.createPage = function() {
    var localData = JSON.parse(localStorage.getItem('localData')) || {};
    var time = new Date().getTime();
    console.log('page', $scope.page);  
    localData[time] = $scope.page;
    localStorage.setItem('localData', JSON.stringify(localData));
    $state.go('app.pages');    
  }

  $scope.page.pictures = {};
  $scope.allPhotos = [];
  $scope.pictureIndex = 1;
  $scope.takePhotoDisabled = false;
  $scope.takePicture = function(pictureIndex) {
    var options =   {
      quality: 75,
      destinationType: 1,
      sourceType: 1,      
      encodingType: 0,
      targetWidth: 320,
      targetHeight: 320
    }
    navigator.camera.getPicture(function(imageURI) {
      $scope.page.pictures[$scope.pictureIndex] = imageURI;
      $scope.allPhotos[$scope.pictureIndex] = imageURI;
      $scope.pictureIndex++;
      $scope.$apply();
    }, function(err) {
      console.err(err);
    }, options);    
  }

  $scope.browsePicture = function(pictureIndex) {
    var options =   {
      quality: 75,    
      maximumImagesCount: 10,  
      width: 320,
      height: 320
    }
    $scope.takePhotoDisabled = true;
    window.imagePicker.getPictures(
      function(results) {
          for (var i = 0; i < results.length; i++) {
              $scope.page.pictures[$scope.pictureIndex] = results[i];
              $scope.allPhotos[$scope.pictureIndex] = results[i];
              $scope.pictureIndex++;
          }
          $scope.takePhotoDisabled = false;
          $scope.$apply();
      }, function (error) {
          console.log('Error: ' + error);
      }, options);      
  }

})