/* Copyright start
  Copyright (C) 2008 - 2023 Fortinet Inc.
  All rights reserved.
  FORTINET CONFIDENTIAL & FORTINET PROPRIETARY SOURCE CODE
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('pAIthon100Ctrl', pAIthon100Ctrl);

  pAIthon100Ctrl.$inject = ['$scope', 'WizardHandler', '$http', 'playbookService', 'toaster', 'clipboard', '$rootScope', '$resource', '$q'];

  function pAIthon100Ctrl($scope, WizardHandler, $http, playbookService, toaster, clipboard, $rootScope, $resource, $q) {
    $scope.moveEnvironmentNext = moveEnvironmentNext;
    // $scope.getDataFromConnector = getDataFromConnector;
    $scope.generateResult = generateResult;
    $scope.viewPopularTasks = viewPopularTasks;
    // $scope.stepResult = '';
    $scope.reviewPlaybook = reviewPlaybook;
    $scope.processing = false;
    $scope.emptyOnChange = emptyOnChange;
    $scope.fetchPlaybookWithTag = '';
    $scope.showDescription = false;
    $scope.inputText = '';
    $scope.playbookDescription = '';
    $scope.updateRichTextHtmlValue = updateRichTextHtmlValue;
    const playbookTags = {
      pBDesignerDescription : ["aibot-description-playbook"],

    }
    $scope.configForMarkdown = {
      initialEditType: 'markdown', //wysiwyg
      previewStyle: 'tab',
      height: '350px',
      usageStatistics: false,
      hideModeSwitch: true,
      toolbarItems: ['heading', 'bold', 'italic', 'strike']
    };

    $scope.options = {
      "name": "Workflow Steps",
      "modes": [
        "view",
        "code"
      ],
      "enableTransform": true,
      "history": false,
      "enableSort": false
    }
    // $scope.json = {
    //   "1": "Step 1",
    //   "2": "Step 2",
    //   "3": "step 3"
    // }

    function emptyOnChange(json) {
      console.log(json)
    }
    function moveEnvironmentNext() {
      WizardHandler.wizard('pAIthonBot-wizard').next();
    }

    function generateResult(playbook, inputText) {
      $scope.processing = true;
      if ($scope.payload.pageContext === 'pb_designer') {
        if (playbook === "playbookSteps") {
          var copyButton = document.getElementById('btn-copy-result');
          copyButton.style.display = "none";
          var regenerateButton = document.getElementById('btn-regenerate-result');
          regenerateButton.style.display = "none";
          var playbookTags = ["aibot-steps-playbook"];
          var parametersForPlaybook = {
            "input": {},
            "request": {
              "data": {
                "records": [],
                "task_to_automate": $scope.playbookDescription
              }
            },
            "task_to_automate": $scope.playbookDescription,
            "useMockOutput": false,
            "globalMock": false
          }
          getDataFromPlaybook(playbookTags, parametersForPlaybook).then(function (data) {
            $rootScope.$broadcast("designer:addPlaybookElements", data.result.query_result);
            $scope.close();
            toaster.info('Copied all selected steps');
          });
        }
        else if (playbook === "description") {
          var generateButton = document.getElementById('generate-result-button');
          generateButton.style.display = "none";
          var playbookTags = ["aibot-description-playbook"];
          var parametersForPlaybook = {
            "input": {},
            "request": {
              "data": {
                "records": [],
                "task_to_automate": inputText
              }
            },
            "task_to_automate": inputText,
            "useMockOutput": false,
            "globalMock": false
          }
          getDataFromPlaybook(playbookTags, parametersForPlaybook).then(function (data) {
            $scope.showDescription = true;
            $scope.playbookDescription = data.result.query_result;
          });
        }
      }
      else if($scope.payload.pageContext === 'jinja_editor'){
        var generateButton = document.getElementById('generate-result-button');
        generateButton.style.display = "none";
        var playbookTags = ["aibot-jinja-editor"];
        var parametersForPlaybook = {
          "input": {},
          "request": {
            "data": {
              "records": [],
              "task_to_automate": inputText
            }
          },
          "task_to_automate": inputText,
          "useMockOutput": false,
          "globalMock": false
        }
      }
    }

    function getDataFromPlaybook(playbookTags, parametersForPlaybook) {
      var defer = $q.defer();

      var queryObjectPlaybook = {
        "sort": [
          {
            "field": "createDate",
            "direction": "DESC",
            "_fieldName": "createDate"
          }
        ],
        "limit": 1,
        "logic": "AND",
        "filters": [
          {
            "field": "recordTags",
            "value": playbookTags,
            "display": "",
            "operator": "in",
            "type": "array"
          },
          {
            "field": "isActive",
            "value": true,
            "operator": "eq"
          }
        ],
        "__selectFields": [
          "id",
          "name"
        ]

      };
      // add a tag to the playbook, get the playbook instead of hardcoding the playbook iri
      getAllPlaybooks(queryObjectPlaybook).then(function (playbook) {
        var queryUrl = '/api/triggers/1/notrigger/' + playbook['hydra:member'][0]['uuid'];
        //Parametersforplaybook -> 'Edit Parameters' in playbook
        $http.post(queryUrl, parametersForPlaybook).then(function (result) {
          if (result && result.data && result.data.task_id) {
            playbookService.checkPlaybookExecutionCompletion([result.data.task_id], function (response) {
              if (response && (response.status === 'finished' || response.status === 'failed')) {
                playbookService.getExecutedPlaybookLogData(response.instance_ids).then(function (res) {
                  $scope.processing = false;
                  defer.resolve(res);
                }, function (err) {
                  defer.reject(err);
                });
              }
            }, function (error) {
              defer.reject(error);
            }, $scope);
          }
          // if (result && result.data && result.data.task_id) {
          //   playbookService.checkPlaybookExecutionCompletion([result.data.task_id], function (response) {
          //     if (response && (response.status === 'finished' || response.status === 'failed')) {
          //       playbookService.getExecutedPlaybookLogData(response.instance_ids).then(function (res) {
          //         $scope.processing = false;
          //         // $scope.stepResult = res;
          //         defer.resolve(res);
          //       }, function (err) {
          //         defer.reject(err);
          //       });
          //     }
          //   }, function (error) {
          //     defer.reject(error);
          //   }, $scope);
          // }
        });
      })
      return defer.promise;
    }

    function getAllPlaybooks(queryObject) {
      var defer = $q.defer();
      var url = 'api/query/workflows';
      $resource(url).save(queryObject, function (response) {
        defer.resolve(response);
      }, function (error) {
        defer.reject(error);
      });
      return defer.promise;
    }

    function reviewPlaybook() {
      // var selectedStep = $scope.stepResult.result.query_result;
      // selectedStep.push($scope.stepResult.result.query_result);
      // var selectedGroups = [];
      // var routes = [];
      // clipboard.copyText(JSON.stringify({
      //   steps: selectedStep.steps,
      //   groups: selectedStep.groups,
      //   routes: selectedStep.routes
      // }));
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.showDescription = false;
        generateResult('playbookSteps')
      }
    }

    function updateRichTextHtmlValue(value) {
      $scope.playbookDescription = value;
    }

    function viewPopularTasks() {

    }

  }
})();
