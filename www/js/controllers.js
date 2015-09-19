angular.module('starter.controllers', [])

.controller('ListCtrl', function($scope, $state, $rootScope, $stateParams, $localStorage, $ionicPopup, $filter, $ionicHistory, $window, $cordovaBarcodeScanner, $cordovaFile) {
    var makeList = function() {
        if($state.current.name == "tab.notreturnlist") {
            $scope.title="未还";
            var itemArr = [];
            for(var i in $localStorage.recordList) {
                if($localStorage.recordList[i].status == 0) {
                    itemArr.push($localStorage.recordList[i]);
                }
            }
            $scope.items = itemArr;
        } else if($state.current.name == "tab.alllist") {
            $scope.title="全部";
            var itemArr = [];
            for(var i in $localStorage.recordList) {
                itemArr.push($localStorage.recordList[i]);
            }
            itemArr.reverse();
            $scope.items = itemArr;
        }
    }



    function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
        //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
        var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
        
        var CSV = '';    
        //Set Report title in first row or line
        
        CSV += ReportTitle + '\r\n\n';

        //This condition will generate the Label/Header
        if (ShowLabel) {
            var row = "";
            
            //This loop will extract the label from 1st index of on array
            for (var index in arrData[0]) {
                
                //Now convert each value to string and comma-seprated
                row += index + ',';
            }

            row = row.slice(0, -1);
            
            //append Label row with line break
            CSV += row + '\r\n';
        }
        
        //1st loop is to extract each row
        for (var i = 0; i < arrData.length; i++) {
            var row = "";
            
            //2nd loop will extract each column and convert it in string comma-seprated
            for (var index in arrData[i]) {
                row += '"' + arrData[i][index] + '",';
            }

            row.slice(0, row.length - 1);
            
            //add a line break after each row
            CSV += row + '\r\n';
        }


        if (CSV == '') {        
            alert("当前没有任何数据， 无法导出");
            return;
        }   
        return CSV;
    }


    $scope.exportItems = function() {
        var exportItemArr = new Array();
        for(var i in $scope.items) {
            var exportItem = {};
            exportItem["编码"] = $scope.items[i]["code"];
            exportItem["借用人"] = $scope.items[i]["name"];
            exportItem["数量"] = $scope.items[i]["num"];
            exportItem["借用时间"] = $scope.items[i]["createTime"];
            exportItem["是否返还"] = $scope.items[i]["isReturnedDesc"];
            exportItem["返还时间"] = $scope.items[i]["returnTime"] ? $scope.items[i]["returnTime"]: '';
            exportItemArr.push(exportItem);
        }

        var title = $scope.title + "借用报表_" + $filter('date')(new Date(), 'yyyy_MM_dd_HH_mm_ss');
        var filename = title + ".csv";
        var filePath = cordova.file.externalRootDirectory + $rootScope.filePath;
        $cordovaFile.createFile(filePath, filename, true).then(function() {
            return $cordovaFile.writeFile(filePath, filename, JSONToCSVConvertor(exportItemArr, title, true), true);
        }).then( function(result) {
            alert("导出成功, 路径为: " + $rootScope.filePath + filename);
        }, function(err) {
            alert(JSON.stringify(err));
        });
        /**var mystyle = {
            headers:true, 
            column: {style:{Font:{Bold:"1"}}},
            rows: {1:{style:{Font:{Color:"#FF0077"}}}},
            cells: {1:{1:{
            style: {Font:{Color:"#00FFFF"}}
            }}}
        };
        alasql('SELECT * INTO XLSXML("Excel' + new Date().getTime() + '.xls",?) FROM ?',[mystyle,$scope.items]);*/

    }

    $scope.$on('$ionicView.enter', function(){
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
        makeList();

        $scope.data = {
            showDelete: false
        }


        $scope.returned = function(id) {
            var successPop = function() {
                var alertPopup = $ionicPopup.alert({
                    title: '提示',
                    template: "编码: " + $localStorage.recordList[id].code + " 确认已还成功."
                });
                alertPopup.then(function(res) {
                    //$state.go($state.current, {}, {reload: true});
                    $window.location.reload(true)
                });
            };


            var confirmPopup = $ionicPopup.confirm({
                title: '请确认',
                template: '确认 ' + $localStorage.recordList[id].code + '*' + $localStorage.recordList[id].num + '----'+ $localStorage.recordList[id].name + ' 已经返还?!'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    $localStorage.recordList[id].status = 1;
                    $localStorage.recordList[id].returnTime = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
                    $localStorage.recordList[id].isReturnedDesc = '是'; //0: 未还, 1: 已还
                    
                    successPop();
                }
            });

        }

        $scope.moveItem = function(item, fromIndex, toIndex) {
            $scope.items.splice(fromIndex, 1);
            $scope.items.splice(toIndex, 0, item);
        }

        $scope.onItemDelete = function(id) {
            var successPop = function() {
                var alertPopup = $ionicPopup.alert({
                    title: '提示',
                    template: "删除成功."
                });
                alertPopup.then(function(res) {
                    makeList();
                    $scope.data.showDelete = false; 
                });
            };


            var confirmPopup = $ionicPopup.confirm({
                title: '请确认',
                template: '确认删除 ' + $localStorage.recordList[id].code + '*' + $localStorage.recordList[id].num + '----'+ $localStorage.recordList[id].name + '?<br>删了就找不回来了呀!'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    delete $localStorage.recordList[id];
                    successPop();
                }
            });
        }

        $scope.onHold = function() {
            $scope.data.showDelete = !$scope.data.showDelete; 
        }

        $scope.hideDelete = function() {
            console.log("test");
            $scope.data.showDelete = false; 
        }

        $scope.scan = function() {
            $cordovaBarcodeScanner.scan()
            .then(function(barcodeData) {
                $scope.searchFilter = barcodeData.text;
             }, function(error) {
             });

        }


    });
    

  
})


.controller('NewCtrl', function($scope, $state, $stateParams, $cordovaBarcodeScanner, $filter, $localStorage, $ionicPopup, $ionicHistory) {
    $scope.$on('$ionicView.enter', function(){
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();

        $scope.isSubmit = false;
        $scope.record = {};
        $scope.record.num = 1;
        $scope.create = function() {
 
            if(!$scope.record.code) {
                alert("编码不能为空");
                return;
            }
            if(!$scope.record.num) {
                alert("数量不能为空");
                return;
            }
            if(!$scope.record.name) {
                alert("借用人姓名不能为空");
                return;
            }
            var confirmPopup = $ionicPopup.confirm({
                title: '请确认',
                template: '确认创建记录: ' + $scope.record.code + '*' + $scope.record.num + '----' + $scope.record.name + '?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    if(!$scope.isSubmit){
                       
                        $scope.isSubmit = true;
                        if(!$localStorage.recordList) {
                            $localStorage.recordList = {};
                        }

                        var now = new Date();
                        $scope.record.id = now.getTime();
                        $scope.record.createTime = $filter('date')(now, 'yyyy-MM-dd HH:mm:ss');
                        $scope.record.status = 0; //0: 未还, 1: 已还
                        $scope.record.isReturnedDesc = '否'; //0: 未还, 1: 已还

                        $localStorage.recordList[$scope.record.id] = $scope.record;
                        var successPop = function() {
                            var alertPopup = $ionicPopup.alert({
                                title: '提示',
                                template: '创建成功'
                            });
                            alertPopup.then(function(res) {
                                $state.go($state.current, {}, {reload: true});
                            });
                        };
                        successPop();

                    }
                }
            });
        };
            

        $scope.scan = function() {
            $cordovaBarcodeScanner.scan()
            .then(function(barcodeData) {
                $scope.record.code = barcodeData.text;
             }, function(error) {
             });

        }

    });
    
  
});
