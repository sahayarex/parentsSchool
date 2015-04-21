angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.authenticatedMenu = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"Marks", "href":"app.marks", "class":"ion-clipboard"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    localStorage.setItem('processing', 'No');
    $state.go('app.dashboard', {}, {reload: true});
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }

  $rootScope.filtersData = {};
  $rootScope.page = '';
  $rootScope.filters = false;
  console.log("CURRENT PAGE: ", $state.current.url.indexOf('dashboard'));
  if($state.current.url.indexOf('dashboard') > -1) {
    $rootScope.filters = true;
    $rootScope.page = "dashboard";
  } else if ($state.current.url.indexOf('allstudents') > -1) {
    $rootScope.filters = true;
    $rootScope.page = "allstudents";
  }
  if($rootScope.filters) {
    var t = new Date();
    var year = t.getFullYear();
    $rootScope.years = {};
    $rootScope.typeofexams = user.typeofexams;
    var range = user.period.split("-");
    var months = ["january", "february", "march", "april", "may", "june", "july", "augest", "september", "october", "november", "december"];
    var start = months.indexOf(range[0].toLowerCase());
    var end = months.indexOf(range[1].toLowerCase());
    if(t.getMonth() >= start) {
      $rootScope.years[year] = year+"-"+(year+1);
      localStorage.setItem("educationyear", year+"-"+(year+1));
      $rootScope.years[year-1] = (year-1)+"-"+year;
    } else {
      $rootScope.years[year] = (year-1)+"-"+year;
      localStorage.setItem("educationyear", (year-1)+"-"+year);
      $rootScope.years[year-1] = (year-2)+"-"+(year-1);
    }
    var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
    if(Object.keys($stateParams).length > 0) {
      $rootScope.filtersData = {year: $stateParams.year, typeofexam: user.typeofexams.indexOf($stateParams.typeofexam)};
    } else {
      if(Object.keys(latestUpdated).length > 0) {
        $rootScope.filtersData = {year: latestUpdated.year, typeofexam: user.typeofexams.indexOf(latestUpdated.typeofexam)};
      } else {
        $rootScope.filtersData = {year: year, typeofexam: 0};
      }
    }
  }

  //Sync online
  setInterval(function() {
    var processing = localStorage.getItem('processing');
    if(processing != 'Yes') {
      if(AuthenticationService.online()) {
        $cordovaSQLite.execute(db, "select id, student, studentid, school, schoolid, typeofexam, marks, total, percentage, grade, attendance, status, year, educationyear, subjects, teacher, teacherid, standard, division, created, action from marks", []).then(function(res) {
          if(res.rows.length > 0) {
            for (var i = 0; i <= res.rows.length - 1; i++) {
              localStorage.setItem("sqlrow", JSON.stringify(res.rows.item(i)));
              var item = JSON.parse(localStorage.getItem("sqlrow")) || {};
              item.marks = JSON.parse(item.marks);
              item.subjects = JSON.parse(item.subjects);
              if(item.action == "create") {
              console.log("local result: ", item);
                AuthenticationService.saveMarks(item).then(function(data) {
                    console.log("Created Data: ", data);
                  if(data._id) {
                    var query = "UPDATE marks SET _id = ?, action = ? WHERE id = ?";
                    $cordovaSQLite.execute(db, query, [data._id, 'created',item.id]).then(function(created) {
                      console.log("updated", created.rows);
                    }, function(createdErr) {
                      console.log("updated err", updatedErr);
                    })
                    localStorage.removeItem("sqlrow");
                    localStorage.setItem('processing', 'No');
                  }
                });  
              } else if (item.action == "update") {
                AuthenticationService.updateMarks(item).then(function(updated) {
                  if(updated._id) {
                    var query = 'UPDATE marks SET action = "updated" WHERE id = '+item.id;
                    $cordovaSQLite.execute(db, query).then(function(created) {
                      console.log("updated", created.rows.item(0));
                    }, function(createdErr) {
                      console.log("updated err", updatedErr);
                    })
                    localStorage.removeItem("sqlrow");
                    localStorage.setItem('processing', 'No');
                  }
                });                
              }              
            };
          }
        }, function(err) {
          //console.log("local err", err);
        })

      }
    }
  }, 3000);  
})

.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, AuthenticationService, $stateParams) {
  console.log("dash scope initialize");
  $rootScope.filterResults = function(page) {
    console.log("Filters data Dash:", $rootScope.filtersData);
    $scope.getMarksData();
  }
  var pass = fail = attendanceVal = totalrecords = 0;
  var subjectMarks = [];
  var subjectLabels = []; 
  var gradeLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];    
  $scope.getMarksData = function() {
    $rootScope.filters = true;
    console.log("user in dashboard:", user);
    var params = $rootScope.filtersData;
    params.schoolid = user.schoolid;
    if(!params.studentid) {
      params.studentid = "all";
    }
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];    
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where schoolid = "'+params.schoolid+'" and year = "'+params.year+'" and typeofexam = "'+type+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        console.log("local rows: ", res.rows);
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectMarks = [];
          subjectLabels = []; 
          gradeLabels = [];
          subjectDataPass = [];
          subjectDataFail = [];    
          var gradeData = j = [];
          for (var i = 0; i <= totalrecords - 1; i++) {
            processMarksVal(res.rows.item(i), i, "offline");
          };
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var processMarksVal = function(v, k, status) {
    var subjects = v.subjects;
    var marks = v.marks;
    if(status == "offline") {
      subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
      console.log("subjects", subjects);
      console.log("marks", marks);
    }
    console.log("record", v);
    console.log("record key", k);
      if(v.status == "Pass")
          pass++;
      if(v.status == "Fail")
          fail++;
      for (var m = 0; m < marks.length ; m++) {
        subjectDataPass[m] = (subjectDataPass[m]) ? subjectDataPass[m] : 0;
        subjectDataFail[m] = (subjectDataFail[m]) ? subjectDataFail[m] : 0;   
        console.log("subject", marks[m][subjects[m]]);
        console.log("passmark", user.passmark);
        if(marks[m][subjects[m]] > user.passmark) {
          subjectDataPass[m]++;
        } else {
          subjectDataFail[m]++;
        }
      };
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
  }
  var applyMarks = function() {
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectLabels = user.subjects;
    $scope.subjectData = [
      subjectDataPass,subjectDataFail
    ];
    console.log("subjectDataPass", subjectDataPass);
    console.log("subjectDataFail", subjectDataFail);
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
    var attendance = attendanceVal * (100/(totalrecords *100));
    $scope.attendanceLabels = ["Present", "Absent"];
    $scope.attendanceData = [attendance, 100 - attendance];          
  }
})
.controller('AllStudentsCtrl', function($scope, $rootScope, $cordovaSQLite, AuthenticationService) {
  $scope.initialize = function() {
    console.log("Student scope initialize");
  }
  $rootScope.filters = true;
  $rootScope.page = "allstudents";
  console.log("all students");
  $rootScope.filterStudentsAll = function(page) {
    console.log("Filters data Students:", $rootScope.filtersData);
    $scope.getStudentsData();
  }

  $scope.getStudentsData = function() {
    console.log("user in students:", user);
    var params = $rootScope.filtersData;
    params.schoolid = user.schoolid;
    if(!params.studentid) {
      params.studentid = "all";
    }
    if(AuthenticationService.online()) {
      AuthenticationService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.allStudentsStatus = true;
          AuthenticationService.getMarks(params).then(function(studentMarks) {
            if(studentMarks.length > 0) {
              angular.forEach(studentMarks, function(mv, mk) {
                mv.grade = mv.grade.replace("Grade ", "");
                mv.percentage = mv.percentage.toPrecision(4);
              })
              $scope.users = studentMarks;
            }
          })
        } else {
          $scope.allStudentsStatus = false;
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where schoolid = "'+params.schoolid+'" and year = "'+params.year+'" and typeofexam = "'+type+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        console.log("local rows: ", res.rows);
        var marks = [];
        if(res.rows.length > 0) {
          for (var i = 0; i <= res.rows.length - 1; i++) {
            marks.push(res.rows.item(i));
          }
          $scope.users = marks;
        }
      }, function(err) {

      });
    }
  }  
})
.controller('StudentDashboardCtrl', function($scope, $rootScope, $state, $stateParams, $ionicSideMenuDelegate, AuthenticationService) {

  $rootScope.dashboard = true;
  $rootScope.filters = true;
  console.log("state Params", $stateParams);
  var user = JSON.parse(localStorage.getItem("user")) || {};
  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
  console.log("latest updated", latestUpdated);
  if(Object.keys($stateParams).length > 0) {
    $scope.params = $stateParams;
    $rootScope.filters = {year: $rootScope.years.indexOf($stateParams.year), typeofexam: user.typeofexams.indexOf($stateParams.typeofexam)};
  } else {
    var year = new Date().getFullYear();
    if(Object.keys(latestUpdated).length > 0) {
      $scope.params = {year: latestUpdated.year, typeofexam: latestUpdated.typeofexam};
      $rootScope.filters = {year: $rootScope.years.indexOf(latestUpdated.year), typeofexam: user.typeofexams.indexOf(latestUpdated.typeofexam)};
    } else {
      $scope.params = {year: year, typeofexam: user.typeofexams[0]};
      $rootScope.filters = {year: $rootScope.years.indexOf(year), typeofexam: 0};
    }
  }
  $scope.params.typeofexam = "all";
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
  $scope.gradeData = [];
  AuthenticationService.getMarks($scope.params).then(function(studentMarks) {
    console.log("got marks man: ", studentMarks);
    if(studentMarks.length > 0) {
      var gradeDataVal = [];
      angular.forEach(studentMarks, function(v,k) {
        if(v.status == "Pass")
            pass++;
        if(v.status == "Fail")
            fail++;
        angular.forEach(v.marks, function(vv, kk) {
          if(parseInt(vv[v.subjects[kk]]) > user.passmark) {
            subjectDataPass[kk] = (subjectDataPass[kk]) ? subjectDataPass[kk] + 1 : 1;
            subjectDataFail[kk] = (subjectDataFail[kk]) ? subjectDataFail[kk] : 0;
          } else {
            subjectDataFail[kk] = (subjectDataFail[kk]) ? subjectDataFail[kk] + 1 : 1;
            subjectDataPass[kk] = (subjectDataPass[kk]) ? subjectDataPass[kk] : 0;
          }
        })
        gradeDataVal[k] = []; 
        angular.forEach(v.marks, function(gv, gk) {
          gradeDataVal[k][gk] = parseInt(gv[v.subjects[gk]]);
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
      $scope.gradeData = gradeDataVal;
      $scope.gradeLabels = user.subjects;
      $scope.gradeSeries = user.typeofexams;
      var attendance = attendanceVal * (100/(studentMarks.length *100));
      $scope.attendanceLabels = ["Present", "Absent"];
      $scope.attendanceData = [attendance, 100 - attendance];
    } else {
      $scope.dashboardStatus = "empty";
    }
  });
})
.controller('MarksCtrl', function($scope, $rootScope, AuthenticationService) {
  $rootScope.filters = false;
  $rootScope.page = 'marks';
  $scope.exams = user.typeofexams;
  
  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
  if(Object.keys(latestUpdated).length > 0) {
    $scope.year = latestUpdated.year;
  } else {
    $scope.year = new Date().getFullYear();
  }
})
.controller('StudentsCtrl', function($scope, $rootScope, $stateParams) {
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
.controller('EnterMarksCtrl', function($scope, $rootScope, $cordovaSQLite, $state, $stateParams, AuthenticationService) {
  console.log("State params: ", $stateParams);
  $scope.marks = {};
  $scope.allmarks = {};
  $scope.allmarksStatus = {};
  $scope.subjects = user.subjects;
  angular.forEach(user.students, function(val, key) {
    if(val.id == $stateParams.studentid) {
      $scope.studentname = val.name;
    }
  });
  angular.forEach(user.subjects, function(sv, sk) {
    $scope.allmarksStatus[sv] = true;
  });
  $scope.createMarks = function() {
    $scope.marks.marks = [];
    angular.forEach(user.subjects, function(sv, sk) {
      $scope.marks.marks[sk] = {};
      $scope.marks.marks[sk][sv] = ($scope.allmarks[sv]) ? parseInt($scope.allmarks[sv]) : 0;
    });
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
    $scope.marks.schoolid = user.schoolid;
    $scope.marks.standard = user.standard;
    $scope.marks.division = user.division;
    $scope.marks.subjects = user.subjects;
    $scope.marks.educationyear = localStorage.getItem("educationyear") || '';
    $scope.marks.created = time;
    var total = 0;
    var status = "Pass";
    angular.forEach($scope.marks.marks, function(mv, mk) {
      console.log("v:", mv);
      console.log("k", mk);
      if(mv[user.subjects[mk]] < user.passmark) {
        status = "Fail";
      }
      total = parseInt(total) + parseInt(mv[user.subjects[mk]]);
    });
    var percentage = (total * (100/(user.subjects.length*100))).toPrecision(4);
    angular.forEach(user.grades, function(gv, gk) {
      if((percentage >= gv.lesser) && ((percentage <= gv.greater))) {
        $scope.marks.grade = (status == "Fail") ? "Grade F" : gv.grade;
      }
    })
    $scope.marks.status = status;
    $scope.marks.total = total;
    $scope.marks.percentage = percentage;
    $scope.marks.created = time;
    $scope.marks.action = "create";
    console.log("before store: ", $scope.marks);
    
    var query = "INSERT INTO marks (";
    var queryVal = ") VALUES (";
    var values = [];
    var i = 1;
    console.log("length of marks:", Object.keys($scope.marks).length);
    console.log("length of marks array:", $scope.marks.length);
    angular.forEach($scope.marks, function(av, ak) {
      console.log("i", i);
      if(Object.keys($scope.marks).length == i) {
        query += ak;
        queryVal += "?";
      } else {
        query += ak+", ";
        queryVal += "?,";
      }
      if((ak == "marks") || (ak == "subjects")) {
        values.push(JSON.stringify(av));
      } else {
        values.push(av);
      }
      i++;
    });
    query += queryVal + ")";
    console.log("query: ", query);
    console.log("values", values);
    $cordovaSQLite.execute(db, query, values).then(function(res) {
      console.log("insertId: " + res.insertId);
      alert("res.insertId: "+res.insertId);
    }, function (err) {
      console.error(err);
      alert("error");
    });
    var allStudents = {};
    var allUpdated = JSON.parse(localStorage.getItem("updatedStudents")) || {};
    if(Object.keys(allUpdated).length > 0) {
      allStudents = allUpdated[year][$scope.marks.typeofexam];
    } else {
      allUpdated[year] = {};
      allUpdated[year][$scope.marks.typeofexam] = {};
    }
    allStudents[$scope.marks.studentid+"time"] = $scope.marks.studentid;
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

.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  $scope.authenticatedMenu = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"Marks", "href":"app.marks", "class":"ion-clipboard"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  if($scope.uid) {
    $scope.authorized = true;
    $scope.menuLinks = $scope.authenticatedMenu;
    localStorage.setItem('processing', 'No');
    $state.go('app.dashboard', {}, {reload: true, inherit: false});
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }
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
      AuthenticationService.login($scope.user).then(function(data) {

        console.log("End of login :", data);
        $scope.email = null;
        $scope.password = null;
        $scope.authorized = true;
        $scope.menuLinks = $scope.authenticatedMenu;
        $rootScope.filters = true;
        $state.transitionTo("app.dashboard", null, {'reload': true});
      });      
    }
  };
})
.controller('LogoutCtrl', function($scope, $http, $state) {
    delete $http.defaults.headers.common.Authorization;
    console.log("Logging out:");
    localStorage.removeItem('uid');
    //$state.go('app.home', {}, {reload: true});
    $state.go("home", {}, {reload: true});
});