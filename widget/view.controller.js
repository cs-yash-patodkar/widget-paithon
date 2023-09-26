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
    $scope.validYAML = false;
    $scope.jinjaResult = '';
    $scope.reviewJinja = reviewJinja;

    $scope.playbookTags = {
      pBDesignerDescription: ["aibot-playbookPlanSuggestion"],
      pBDesignerSteps: ["aibot-playbookBlockSuggestion"],
      jinjaEditor: ["aibot-playbookJinjaSuggestion"]
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
      mode: 'view', 
      modes: ['view', 'code'],
      "enableTransform": true,
      "history": false,
      "enableSort": false
    }

    function emptyOnChange(json) {
      console.log(json)
    }
    function moveEnvironmentNext() {
      WizardHandler.wizard('pAIthonBot-wizard').next();
    }

    function generateResult(inputText, playbook) {
      $scope.processing = true;
      if ($scope.payload.pageContext === 'pb_designer') {
        if (playbook === "playbookSteps") {
          var copyButton = document.getElementById('btn-copy-result');
          copyButton.style.display = "none";
          var regenerateButton = document.getElementById('btn-regenerate-result');
          regenerateButton.style.display = "none";
          // var playbookTags = ["aibot-steps-playbook"];
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
          getDataFromPlaybook($scope.playbookTags.pBDesignerSteps, parametersForPlaybook).then(function (data) {
            if(data.result && data.result.data){
              $rootScope.$broadcast("designer:addPlaybookElements", data.result.data);
              $scope.close();
              toaster.info('Copied all selected steps');
            }
            else{
              $scope.close();
              toaster.info('Could not fetch result. Please try again.');
            }
          });
        }
        else if (playbook === "description") {
          var generateButton = document.getElementById('generate-result-button');
          generateButton.style.display = "none";
          // var playbookTags = ["aibot-description-playbook"];
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
          getDataFromPlaybook($scope.playbookTags.pBDesignerDescription, parametersForPlaybook).then(function (data) {
            $scope.showDescription = true;
            if (data.result) {
              if (data.result.query_result) {
                $scope.playbookDescription = data.result.query_result;
              }
              else {
                $scope.playbookDescription = "Playbook Failed";
              }
            }
          });
        }
      }

      else if ($scope.payload.pageContext === 'jinja_editor') {
        var generateButton = document.getElementById('generate-jinja-button');
        generateButton.style.display = "none";
        // var playbookTags = ["aibot-jinja-editor"];
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
        getDataFromPlaybook($scope.playbookTags.jinjaEditor, parametersForPlaybook).then(function (data) {
          // $scope.showDescription = true;
          if (data.result) {
            if (data.result.query_result) {
              $scope.jinjaResult = data.result.query_result;
            }
            else {
              $scope.jinjaResult = "Playbook Failed";
            }
          }
        });
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

    function reviewJinja() {
      clipboard.copyText($scope.jinjaResult);
      $scope.close();
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
        generateResult($scope.playbookDescription, 'playbookSteps')
      }
    }

    // function validateYaml(yamlString) {
    //   // Basic YAML structure pattern
    //   const yamlPattern = /^(\s*[-]?\s*.*\s*(:|->|!|&|[*])\s*)+$/m;
    //   if (yamlPattern.test(yamlString)) {
    //     $scope.validYAML = true;
    //   } else {
    //     $scope.validYAML = false;
    //   }
    // }

    function updateRichTextHtmlValue(value) {
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.playbookDescription = value;
      }
      else if ($scope.payload.pageContext === 'jinja_editor') {
        $scope.jinjaResult = value;
      }
    }

    function viewPopularTasks() {

    }

  }
})();
