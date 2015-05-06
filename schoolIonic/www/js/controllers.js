angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $stateParams, $cordovaSQLite, $rootScope, $state, MyService) {
  $scope.uid = localStorage.getItem('uid') || '';
  user = JSON.parse(localStorage.getItem('user')) || user;
  if($scope.uid) {
    $scope.authorized = true;
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
    $scope.menuLinks = {"Links":[{"title":"log-in", "href":"app.home", "class": "ion-log-in"}]};
  }
  if(localStorage.getItem('filterdata')) {
    filtersData = JSON.parse(localStorage.getItem('filterdata'));
  } else {
    filtersData.years = user.years;
    filtersData.educationyear = user.years.indexOf(user.educationyear);
    user.typeofexams.unshift("All");
    filtersData.typeofexams = user.typeofexams;
    filtersData.typeofexam = user.typeofexams.indexOf(user.latesttypeofexam);
  }
  localStorage.setItem('filtersData', JSON.stringify(filtersData));
  $rootScope.filtersData = filtersData;
  console.log("CURRENT STATE", $state.current);
  var filterStatus = function(page) {
    $rootScope.noexams = false;
    $rootScope.page = page;
    console.log("dashboard index:", page.indexOf('ashboard'));
    console.log("Page:", page);
    if(page.indexOf('ashboard') > 0) {
        $rootScope.filters = true;
    } else {
        $rootScope.filters = false;
    }
  } 
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    filterStatus(toState.name);
  })
  filterStatus($state.current.name);
})
.controller('HmDashboardCtrl', function($scope, $rootScope, $state, _, $cordovaSQLite, MyService, $stateParams) {
  var updateditems = subjectMarks = subjectLabels = gradeLabels = subjectDataPass = subjectDataFail = toppers = [];
  var pass = fail = attendanceVal = totalrecords = 0;   
  var gradeData = {};
  $rootScope.hmfilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    $scope.getMarksData();
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
  }
  $scope.getMarksData = function() { 
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+'_hm';
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          pass = 0;
          fail = 0;
          subjectDataPass = [];
          subjectDataFail = [];
          var gradeData = {};
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
        totalrecords = res.rows.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectDataPass = [];
          subjectDataFail = [];    
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
  var processMarksVal = function(v, k, status) {
    var subjects = user.subjects;
    var marks = v.marks;
      if(v.status == "Pass") pass++;
      if(v.status == "Fail") fail++;
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
      if(gradeData[v.grade]) {
        console.log("old one", gradeData[v.grade].y);
        gradeData[v.grade] = {name: v.grade, y: parseInt(gradeData[v.grade].y) + 1};
      } else {
        gradeData[v.grade] = {name: v.grade, y: 1};
      }
      gradeLabels = [];
/*      for (var i = 0; i < user.grades.length; i++) {
        j[i] = (j[i]) ? j[i] : 0;
        if(user.grades[i].grade == v.grade) {
            j[i]++;
        }
        gradeLabels[i] = user.grades[i].grade;
        if(!gradeData) {
          gradeData = {};
        }
      };*/
      if(attendanceVal > 0) {
        attendanceVal = parseInt(v.attendance);
      } else {
        attendanceVal = attendanceVal + parseInt(v.attendance);
      }
  }
  var applyMarks = function() {
    $scope.statusData = [pass,fail];
    var gradeVal = [];
    angular.forEach(gradeData, function(gv, gk) {
      gradeVal.push(gv);
    })
    $scope.gradeData = [gradeData];
    $scope.gradeLabels = gradeLabels;
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
        console.log("gradeVal", gradeVal);
    var options = {
        chart: {
          renderTo: 'passfailstatus',
          animation: true,
          type: 'pie',
          options3d:{
                enabled: true,
                alpha: 45,
                beta: 0
          },
          height: 200,
        },
        title: {
            text: '',
        },
        tooltip: {
            enabled: false
        },
        plotOptions: {
            pie: {
                innerSize: 50,
                depth: 35,
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: <b>{point.y}</b>'
                }
            }
        },
        series: [{
            type: 'pie',
            name: 'Total',
            data: [
              ["Pass", pass],
              ["Fail", fail],
            ]
        }]
      };
    var chart = new Highcharts.Chart(options);
    options.chart.renderTo = "grades";
    options.plotOptions.pie.innerSize = 0;
    options.series[0].data = gradeVal;
    var chart1 = new Highcharts.Chart(options);
  console.log("gradeData", user.subjects);
  console.log("pass", passvals);
  console.log("fail", failvals);
    var options2 = {
      chart: {
            renderTo: "subjectmarks",
            type: 'column',
            options3d: {
                enabled: true,
                alpha: 10,
                beta: 5,
                depth: 70
            },
        },
        title: {
            text: ''
        },
        plotOptions: {
            column: {
                depth: 25
            }
        },
        scrollbar: {
          enabled: true
        },
        xAxis: {
            categories: Highcharts.getOptions().lang.shortMonths
        },
        yAxis: {
            title: {
                text: null
            }
        },
        series: [{
            name: 'Sales',
            data: [2, 3, null, 4, 0, 5, 1, 4, 6, 3]
        },{
            name: 'test',
            data: [2, 3, null, 4, 0, 5, 1, 4, 6, 3]
        }]
      };
    var chart2 = new Highcharts.Chart(options2);
  }
})
.controller('DashboardCtrl', function($scope, $rootScope, $state, $cordovaSQLite, MyService, $stateParams) {
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
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
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
          console.log("its empty");
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
.controller('AllClassesCtrl', function($scope, $rootScope, $cordovaSQLite, MyService) {
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
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
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
.controller('AllStudentsCtrl', function($scope, $stateParams, $rootScope, $cordovaSQLite, MyService) {
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
    }
    if(MyService.online()) {
      MyService.getUsers(params).then(function(users) {
        if(users.length > 0) {
          console.log("Got all users:", users);
          $scope.allStudents = true;
          $scope.users = users;
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
          $scope.allStudents = true;
          $scope.users = allusers;
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('StudentDashboardCtrl', function($scope, $rootScope, $cordovaSQLite, $state, $stateParams, $ionicSideMenuDelegate, MyService) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.user = user;
  $rootScope.studentFilterResults = function(page) {
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  var subjectMarks = [];
  var subjectLabels = []; 
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
    }    
    console.log("params", params);
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam]+params.studentid;
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
          subjectMarks = [];
          subjectLabels = []; 
          angular.forEach(studentMarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
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
          console.log("no marks");
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
          subjectMarks = [];
          subjectLabels = []; 
          var allmarks = JSON.parse(res.rows.item(0).value);
          console.log("allmarks", allmarks);
          angular.forEach(allmarks, function(v,k) {
            processMarksVal(v, k, "online");
          })
        } else {
          $scope.dashboardStatus = "empty";
        }
      }, function(err) {

      });
    }
  }
  var processMarksVal = function(v, k, status) {
    var marks = v.marks;
    if(status == "offline") {
      marks = JSON.parse(v.marks);
    }
    marks.forEach(function(mv, mk) {
      angular.forEach(mv, function(mvv, mkk) {
        if((mkk != "status")) {
          subjectLabels.push(mkk);
          subjectMarks.push(mvv);
        }
      })
    })
    $scope.subjectLabels = subjectLabels;
    $scope.subjectMarks = [subjectMarks];
    if(v.attendance) {
      $scope.attendanceLabels = ["Present", "Absent"];
      var att = v.attendance.split("/");
      $scope.attendanceData = [att[0], parseInt(att[1]) - parseInt(att[0])];
    }
    $scope.mark = v;
  }
})
.controller('StudentOverallDashboardCtrl', function($scope, $rootScope, $stateParams, $cordovaSQLite, MyService) {
      var examLabels = [];
    var examMarks = [];
    var examGrades = [];
    var allsubjects = [];
    var subjectDataMarks = {};
    var eachData = [];
    var attendance = [];
    $rootScope.noexams = true;
  $rootScope.overallFilterResults = function(page) {
    console.log("Filtersdata", $rootScope.filtersData);
    filtersData = $rootScope.filtersData;
    localStorage.setItem('filtersData', JSON.stringify(filtersData));
    $scope.getMarksData();
  }
  $scope.getMarksData = function() {
    var params = filtersData;
    params.schoolid = user.schoolid;
    params.year = user.years[params.educationyear];
    params.standard = user.standard;
    params.division = (user.division) ? user.division : "all";
    var dbkey = params.schoolid +'_'+params.year+'_'+user.typeofexams[params.typeofexam];
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += '_'+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += '_'+$stateParams.division;
    }    
    if($stateParams.studentid) {
      params.studentid = $stateParams.studentid;
      params.typeofexam = "all";
      dbkey += '_'+$stateParams.studentid;
    }
    if(!params.studentid) {
      params.studentid = "all";
    }
    console.log("params", params);
    if(MyService.online()) {
      MyService.getMarks(params).then(function(studentMarks) {
        console.log("Got marks:", studentMarks);
        totalrecords = studentMarks.length;
        if(totalrecords > 0) {
          $scope.dashboardStatus = "not empty";
            examLabels = [];
            examMarks = [];
            examGrades = [];
            eachData = [];
            subjectDataMarks = {};
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
  var processMarksVal = function(v, k, status) {
    examLabels.push(v.typeofexam);
    examMarks.push(v.percentage);
    attendance.push(v.attendanceP);
    v.marks.forEach(function(mv, mk) {
      angular.forEach(mv, function(mvv, mkk) {
        if((mkk != "status")) {
          if(allsubjects.indexOf(mkk) == -1) {
            allsubjects.push(mkk);
          }
          if(!subjectDataMarks[mkk])
            subjectDataMarks[mkk] = [];
          if(!subjectDataMarks[mkk][0])
            subjectDataMarks[mkk][0] = [];
          subjectDataMarks[mkk][0].push(parseInt(mvv));
        }
      })
    })
  }
  var applyMarks = function() {
    console.log("allsubjects", allsubjects);
    console.log("attendance", attendance);
    $scope.examLabels = examLabels;
    $scope.examMarks = [examMarks];
    $scope.allsubjects = allsubjects;
    $scope.subjectMarks = subjectDataMarks;
    $scope.attendanceVal = [attendance];
  }
})
.controller('StudentProfileCtrl', function($scope, $rootScope, $cordovaSQLite, MyService, $stateParams) {
  var filtersData = JSON.parse(localStorage.getItem('filtersData'));
  $scope.currentuser = user;
  $scope.filtersData = filtersData;
  $scope.getStudentsData = function() {
    var dbkey = user.schoolid;
    var params = {};
    params.schoolid = user.schoolid;
    if($stateParams.standard) {
      params.standard = $stateParams.standard;
      dbkey += "_"+$stateParams.standard;
    }
    if($stateParams.division) {
      params.division = $stateParams.division;
      dbkey += "_"+$stateParams.division;
    }
    if($stateParams.studentid) {
      params._id = $stateParams.studentid;
      dbkey += "_"+$stateParams.studentid;
    }
    if(MyService.online()) {
      console.log("GGGGGGGGGGGG", params);
      MyService.getUsers(params).then(function(users) {
          console.log("Got all users:", users);
        if(users.length > 0) {
          $scope.allStudents = true;
          $scope.user = users[0];
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
          $scope.allStudents = true;
          $scope.user = allusers[0];
        } else {
          $scope.allStudents = false;
        }
      }, function(err) {
        console.log("offline all users error", err);
      });
    }
  }
})
.controller('LoginCtrl', function($scope, $rootScope, $http, $state, $ionicPopup, MyService) {
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
      MyService.login($scope.user).then(function(data) {

        console.log("End of login :", data);
        $scope.email = null;
        $scope.password = null;
        $scope.authorized = true;
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
    $state.go("home", {}, {reload: true});
});
