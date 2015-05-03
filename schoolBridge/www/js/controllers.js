angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, AuthenticationService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = JSON.parse(localStorage.getItem('user')) || user;
  $scope.anonymousMenu = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  if($scope.uid) {
    $scope.authorized = true;
    localStorage.setItem('processing', 'No');
    if(user.role == "hm") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"app.allclasses", "class": "ion-easel"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.hmdashboard', {}, {reload: true});
    } else if (user.role == "parent") {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.dashboard', {}, {reload: true});
    } else {
      $scope.menuLinks = {"Links":[{"title":"Dashboard", "href":"app.dashboard", "class":"ion-stats-bars"}, {"title":"Students", "href":"app.allstudents", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]};                            
      $state.go('app.dashboard', {}, {reload: true});
    }
  } else {
    $scope.authorized = false;
    $scope.menuLinks = $scope.anonymousMenu;
  }
  if(localStorage.getItem('filterdata')) {
    var filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    var filtersData = {};
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    user.typeofexams.unshift("All");
    filtersData.typeofexams = user.typeofexams;
    filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
  }
  console.log("CURRENT PAGE: ", $state.current);
  $rootScope.page = $state.current.name;
/*
  $rootScope.filters = false;
  if($state.current.url.indexOf('dashboard') > -1) {
    $rootScope.filters = true;
    $rootScope.page = "dashboard";
  } else if ($state.current.url.indexOf('allstudents') > -1) {
    $rootScope.filters = true;
    $rootScope.page = "allstudents";
  } else {
    $rootScope.filters = false;
    $rootScope.page == "nofilters";
  }
  if($rootScope.filters) {
    var t = new Date();
    var year = t.getFullYear();
    filtersData.years = {};
    filtersData.typeofexams = user.typeofexams;
    var range = user.period.split("-");
    var months = ["january", "february", "march", "april", "may", "june", "july", "augest", "september", "october", "november", "december"];
    var start = months.indexOf(range[0].toLowerCase());
    var end = months.indexOf(range[1].toLowerCase());
    if(t.getMonth() > start) {
      filtersData.years[year] = year+"-"+(year+1);
      localStorage.setItem("educationyear", year+"-"+(year+1));
      filtersData.years[year-1] = (year-1)+"-"+year;
    } else {
      filtersData.years[year] = (year-1)+"-"+year;
      localStorage.setItem("educationyear", (year-1)+"-"+year);
      filtersData.years[year-1] = (year-2)+"-"+(year-1);
    }
    }*/
    var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
    if(Object.keys($stateParams).length > 0) {
      filtersData.educationyear = $stateParams.educationyear;
      filtersData.typeofexam = user.typeofexams.indexOf($stateParams.typeofexam);
    } else {
      if(Object.keys(latestUpdated).length > 0) {
        filtersData.educationyear = latestUpdated.educationyear;
        filtersData.typeofexam = user.typeofexams.indexOf(latestUpdated.typeofexam);
      }
    }
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    console.log("FiltersData:", filtersData);
    $rootScope.filtersData = filtersData;

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
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, AuthenticationService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  var updateditems = [];
  var subjectMarks = [];
  var pass = fail = attendanceVal = totalrecords = 0;
  var subjectLabels = []; 
  var gradeLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];  
  var toppers = [];  
  $scope.getMarksData = function() {
    $rootScope.filters = true;
    console.log("user in dashboard:", user);
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+'_hm';
    console.log("dbkey", dbkey);
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
          toppers = [];
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            console.log("record count", sres.rows.length);
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
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
          toppers = [];
          var gradeData = j = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var kkkk = 0;
  var processMarksVal = function(v, k, status) {
    var subjects = user.subjects;
    var marks = v.marks;
    if(status == "offline") {
     // subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
    }
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
/*            if(mkk == "english") {
              kkkk++;
              console.log("mark", mvv);
              console.log("pass", subjectDataPass[mkk]);
              console.log("fail", subjectDataFail[mkk]);
            } */          
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
  }
  var applyMarks = function() {
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    console.log("toppersList", toppersList);
    $scope.toppers = toppersList;
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectData = []; 
    $scope.subjectLabels = user.subjects;
    var passvals = []
    var failvals = []
    angular.forEach(user.subjects, function(us, uk) {
      passvals.push(subjectDataPass[us]);
      failvals.push(subjectDataFail[us]);
    })
    $scope.subjectData = [
      passvals,failvals
    ];
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
/*    var attendance = attendanceVal * (100/(totalrecords *100));
    $scope.attendanceLabels = ["Present", "Absent"];
    $scope.attendanceData = [attendance, 100 - attendance]; */         
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, AuthenticationService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.filterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var updateditems = [];
  var subjectMarks = [];
  var pass = fail = attendanceVal = totalrecords = 0;
  var subjectLabels = []; 
  var gradeLabels = [];
  var subjectDataPass = [];
  var subjectDataFail = [];  
  var subjectDataMarks = [];    
  var toppers = [];  
  var topperSubjects = [];
  var allsubjects = [];
  $scope.getMarksData = function() {
    $rootScope.filters = true;
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    if(!params.studentid) {
      params.studentid = "all";
    }
    var standard = '';
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      standard = '_'+$stateParams.standard;
      $scope.standard = $stateParams.standard;
    }
    var division = '_all';
    if($stateParams.division) {
      params.division = $stateParams.division;
      division = '_'+$stateParams.division;
      $scope.division = $stateParams.division;
    }    
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+standard+division;
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
          subjectDataMarks = [];       
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
          var query = "INSERT into marks (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from marks where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(studentMarks)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.dashboardStatus = "empty";
        }    
      });
    } else {
      var type = user.typeofexams[params.typeofexam];
      var query = 'SELECT * from marks where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
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
          subjectDataMarks = [];    
          toppers = [];
          topperSubjects = [];
          var gradeData = j = [];
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
          applyMarks();
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var kkkk = 0;
  var processMarksVal = function(v, k, status) {
    //var subjects = user.subjects;
    var marks = v.marks;
    if(status == "offline") {
     // subjects = JSON.parse(v.subjects);
      marks = JSON.parse(v.marks);
    }
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
          if((mkk != "status")) {
            if(allsubjects.indexOf(mkk) == -1) {
              allsubjects.push(mkk);
            }
            subjectDataPass[mkk] = (subjectDataPass[mkk]) ? subjectDataPass[mkk] : 0;
            subjectDataFail[mkk] = (subjectDataFail[mkk]) ? subjectDataFail[mkk] : 0;   
            if(mvv >= user.passmark) {
              subjectDataPass[mkk]++;
            } else {
              subjectDataFail[mkk]++;
            }
            if(subjectDataMarks[mkk]) {
              subjectDataMarks[mkk] = parseInt(mvv) + subjectDataMarks[mkk];
            } else {
              subjectDataMarks[mkk] = parseInt(mvv);
            }
            if(topperSubjects[mkk]) {
              if(parseInt(mvv) > topperSubjects[mkk].total) {
                topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
              } else if (parseInt(mvv) == topperSubjects[mkk].total) {
                topperSubjects[mkk].student = topperSubjects[mkk].student + "," + v.student;
              }
            } else {
              topperSubjects[mkk] = {total: mvv, student:v.student, subject: mkk, classd: v.standard+v.division.toUpperCase()};              
            }
            console.log("mark", topperSubjects[mkk]);
/*            if(mkk == "english") {
              kkkk++;
              console.log("mark", mvv);
              console.log("pass", subjectDataPass[mkk]);
              console.log("fail", subjectDataFail[mkk]);
            }  */         
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
  }
  var applyMarks = function() {
    var toppersList = [];
    _.each(toppers, function(v, k) {
      if(v) {
        toppersList.push(v);
      }
    });
    $scope.toppers = toppersList;
    $scope.statusLabels = ["Pass", "Fail"];
    $scope.subjectSeries = ["Pass", "Fail"];
    $scope.subjectData = []; 
    $scope.subjectLabels = allsubjects;
    var passvals = [];
    var failvals = [];
    var marksvals = [];
    var topperS = [];
    angular.forEach(allsubjects, function(us, uk) {
      if(subjectDataPass[us]) {
        passvals.push(subjectDataPass[us]);
        failvals.push(subjectDataFail[us]);
      } else {
        passvals.push(0);
        failvals.push(0);
      }
      if(subjectDataMarks[us]) {
        marksvals.push(subjectDataMarks[us]*(100/(totalrecords*100)));
      } else {
        marksvals.push(0);
      }
      if(topperSubjects[us]) {
        topperS.push(topperSubjects[us]);
      } else {
        topperS.push({total:0, student:"", subject: us, classd: ""});
      }
    })
    console.log("labels", allsubjects);
    $scope.subjectData = [
      passvals,failvals
    ];
    $scope.subjectMarks = [
      marksvals
    ];
    $scope.subjectToppers = topperS;
    console.log("values", $scope.subjectData);
    $scope.statusData = [pass,fail];
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
  }
})
.controller('AllClassesCtrl', function($scope, $rootScope, $cordovaSQLite, AuthenticationService) {
  $rootScope.filters = false;
  var processUsers = function(users) {
    $scope.allClasses = true;
    var classes = [];
    var all = [];
    var standard = [];
    angular.forEach(users, function(uv, uk) {
      var allusers = [];
      var classd = uv.standard + uv.division;
      if(classes.indexOf(classd) == -1) {
        uv.classd = uv.standard + uv.division;
        allusers.push(uv);
        classes.push(classd);
        var sdkey = uv.standard+uv.division;
        var skey = uv.standard;
        if(uv.standard.length > 1) {
          sdkey = "_"+sdkey;
          skey = "_"+skey;
        }
        console.log("standard", uv.standard);
        console.log("division", uv.division);
        if(standard.indexOf(uv.standard) == -1 ) {
          all.push({standard:uv.standard, d: "all", division: "", classd: skey});
          standard.push(uv.standard);
        }
        all.push({standard:uv.standard, d:uv.division, division: uv.division.toUpperCase(), classd: sdkey});
      }
    });
    $scope.users = all;
  }
  $scope.getClassesData = function() {
    var params = {};
    params.schoolid = user.schoolid;
    var dbkey = user.schoolid+"_students";
    if(AuthenticationService.online()) {
      AuthenticationService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users);
          processUsers(users);
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allClasses = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          processUsers(allusers);
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }  
})
.controller('AllStudentsCtrl', function($scope, $rootScope, $cordovaSQLite, AuthenticationService) {
  $rootScope.filters = false;
  var processUsers = function(users) {
    $scope.allStudents = true;
    var classes = [];
    var all = [];
    var standard = [];
    angular.forEach(users, function(uv, uk) {
      var allusers = [];
      var classd = uv.standard + uv.division;
      if(classes.indexOf(classd) == -1) {
        uv.classd = uv.standard + uv.division;
        allusers.push(uv);
        classes.push(classd);
        var sdkey = uv.standard+uv.division;
        var skey = uv.standard;
        if(uv.standard.length > 1) {
          sdkey = "_"+sdkey;
          skey = "_"+skey;
        }
        console.log("standard", uv.standard);
        console.log("division", uv.division);
        if(standard.indexOf(uv.standard) == -1 ) {
          all.push({standard:uv.standard, d: "all", division: "", classd: skey});
          standard.push(uv.standard);
        }
        all.push({standard:uv.standard, d:uv.division, division: uv.division.toUpperCase(), classd: sdkey});
      }
    });
    $scope.users = all;
  }
  $scope.getStudentsData = function() {
    var params = {};
    params.schoolid = user.schoolid;
    var dbkey = user.schoolid+"_students";
    if(AuthenticationService.online()) {
      AuthenticationService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users);
          processUsers(users);
          var query = "INSERT into users (key, value) VALUES (?, ?)";
          var selectq = 'SELECT key from users where key = "'+dbkey+'"';
          $cordovaSQLite.execute(db, selectq).then(function(sres) {
            if(sres.rows.length == 0) {
              var values = [dbkey, JSON.stringify(users)];
              $cordovaSQLite.execute(db, query, values).then(function(res) {
                console.log("insertId: " + res.insertId);
              })
            }
          })
        } else {
          $scope.allStudents = false;
        }    
      });
    } else {
      var query = 'SELECT * from users where key = "'+dbkey+'"';
      $cordovaSQLite.execute(db, query).then(function(res) {
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          var allusers = JSON.parse(res.rows.item(0).value);
          processUsers(allusers);
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
/*  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.initialize = function() {
    console.log("Student scope initialize");
  }
  $rootScope.filters = true;
  $rootScope.page = "allstudents";
  console.log("all students");
  $rootScope.filterStudentsAll = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getStudentsData();
    localStorage.setItem('filtersData', JSON.stringify(filtersDStudents  }

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
  }*/  
})
.controller('StudentDashboardCtrl', function($scope, $rootScope, $state, $stateParams, $ionicSideMenuDelegate, AuthenticationService) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $rootScope.dashboard = true;
  $rootScope.filters = true;
  console.log("STUDENTS PARAMS", $stateParams);
  var user = JSON.parse(localStorage.getItem("user")) || {};
/*  var latestUpdated = JSON.parse(localStorage.getItem("latestUpdated")) || {};
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
  }*/
  var params = filtersData;
  params.studentid = $stateParams.studentid;
  params.schoolid = user.schoolid;
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
  console.log("params", params);
  AuthenticationService.getMarks(params).then(function(studentMarks) {
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
    email: '8951572125@school-a.com',
    password: 'RiRualr+mm7mWve0wjNO7Q=='
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
        if(data.role == "hm") {
          $state.transitionTo("app.hmdashboard", null, {'reload': true});
        } else if (data.role == "parent") {
          $state.transitionTo("app.dashboard", null, {'reload': true});
        } else {
          $state.transitionTo("app.dashboard", null, {'reload': true});
        }
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