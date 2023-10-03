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

  pAIthon100Ctrl.$inject = ['$scope', 'WizardHandler', 'config', '$http', 'playbookService', 'toaster', 'clipboard', '$rootScope', '$resource', '$q'];

  function pAIthon100Ctrl($scope, WizardHandler, config, $http, playbookService, toaster, clipboard, $rootScope, $resource, $q) {

    $scope.userInput = {
      textVal: ''
    };

    $scope.inputText = {
      inputText: ''
    };

    $scope.generatePlaybookDescription = generatePlaybookDescription;

    $scope.botType = 'Conversation';
    $scope.reviewPlaybook = reviewPlaybook;
    $scope.processing = false;
    $scope.showDescription = false;
    $scope.playbookDescription = '';
    $scope.updateRichTextHtmlValue = updateRichTextHtmlValue;
    $scope.playbookTags = {
      pBDesignerDescription: ["aibot-playbookPlanSuggestion"],
      pBDesignerSteps: ["aibot-playbookBlockSuggestion"],
      jinjaEditor: ["aibot-playbookJinjaSuggestion"],
      conversation: ["aibot-conversation"]
    }
    $scope.receivingResponse = false;
    $scope.options = {
      "name": "Workflow Steps",
      mode: 'view',
      modes: ['view'],
      "enableTransform": true,
      "history": false,
      "enableSort": false
    }
    $scope.chatMessages = [];
    $scope.sendMessage = function (event, flagEnterClick) {
      if ((event.keyCode === 13 && !event.shiftKey) || flagEnterClick) { // Check if Enter key is pressed
        $scope.chatMessages.push({ text: $scope.userInput.textVal, type: 'user' });
        $scope.userInput.textVal = ''; // Clear the input field
        // Process user input and generate a bot response
        generateBotResponse($scope.chatMessages);
      }
    };

    // Function to generate a bot response 
    function generateBotResponse(userMessage) {
      $scope.receivingResponse = true;
      var parametersForPlaybook = {
        "input": {},
        "request": {
          "data": {
            "records": [],
            "conversation": userMessage
          }
        },
        "conversation": userMessage,
        "useMockOutput": false,
        "globalMock": false
      }
      getDataFromPlaybook($scope.playbookTags.conversation, parametersForPlaybook).then(function (data) {
        // $scope.showDescription = true;
        if (data.result) {
          if (data.result.query_result) {
            $scope.receivingResponse = false;
            $scope.chatMessages.push({ text: data.result.query_result, type: 'bot' });
          }
          else {
            $scope.chatMessages.push({ text: "Playbook Failed", type: 'bot' });
          }
        }
      });
    }

    function reviewPlaybook() {
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.processing = true;
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
        getDataFromPlaybook($scope.playbookTags.pBDesignerSteps, parametersForPlaybook).then(function (data) {
          if (data.result && data.result.data) {
            $rootScope.$broadcast("designer:addPlaybookElements", data.result.data);
            $scope.close();
            toaster.info('Copied all selected steps');
          }
          else {
            $scope.close();
            toaster.info('Could not fetch result. Please try again.');
          }
        });
      }
    }

    function generatePlaybookDescription(inputText) {
      $scope.processing = true;
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.showDescription = false;

        var generateButton = document.getElementById('generate-result-button');
        if (generateButton) {
          generateButton.style.display = "none";

        }
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
            if (data.result.query_result && data.result.query_result.result) {
              $scope.playbookDescription = data.result.query_result.result;
            }
            else {
              $scope.playbookFailed = true;
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
        var queryUrl = '/api/triggers/1/notrigger/' + playbook['hydra:member'][0]['uuid'] + '?force_debug=true';
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

    function updateRichTextHtmlValue(value) {
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.playbookDescription = value;
      }
    }
  }
})();
