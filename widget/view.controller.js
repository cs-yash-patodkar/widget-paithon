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

  pAIthon100Ctrl.$inject = ['$scope', '$http', 'playbookService', 'toaster', 'clipboard', '$rootScope', '$resource', '$q', '$timeout'];

  function pAIthon100Ctrl($scope, $http, playbookService, toaster, clipboard, $rootScope, $resource, $q, $timeout) {

    $scope.userInput = {
      textVal: ''
    };
    $scope.inputText = {
      inputText: '',
    };
    $scope.generatePlaybookDescription = generatePlaybookDescription;
    $scope.onChangeMode = onChangeMode;
    $scope.botType = 'Conversation';
    $scope.reviewPlaybook = reviewPlaybook;
    $scope.processing = false;
    $scope.showDescription = false;
    $scope.playbookDescription = '';
    $scope.updateRichTextHtmlValue = updateRichTextHtmlValue;
    $scope.playbookTags = {
      pBDesignerDescription: ["aibot-playbookPlanSuggestion"],
      pBDesignerSteps: ["aibot-playbookBlockSuggestion"],
      conversation: ["aibot-conversation"]
    }
    $scope.receivingResponse = false;
    $scope.options = {
      "name": "Workflow Steps",
      mode: 'form',
      modes: ['code', 'form'],
      "enableTransform": true,
      "history": false,
      "enableSort": false,
      'navigationBar': false,
      'statusBar': false,
      'mainMenuBar': true
    }
    $scope.configForMarkdown = {
      initialEditType: 'markdown', //wysiwyg
      previewStyle: 'tab',
      height: '420px',
      usageStatistics: false,
      hideModeSwitch: true,
      toolbarItems: ['']
    };
    //Initial message for conversation 
    $scope.conversationMessages = [
      {
        text: "Hi there! How can I help you today? Ask me questions like ‘how can I remove all HTML tags from a string’ OR ‘give some suggestions for responding to Ransomware alerts’ or ‘log samples for Fortigate firewall’...",
        type: "bot"
      }
    ];

    //Initial message for playbook suggestion
    $scope.playbookSuggestionMessages = [
      {
        text: "Hi there! How can I help you today? I can help you generate playbook templates for your common use cases. For help on best practices on asking questions that give best results, use the 'help' icon above..",
        type: "botGeneral"
      }
    ];

    //When radio button selection is changed
    function onChangeMode() {
      delete $scope.userInput.textVal;
    }

    //scroll to bottom when new conversation message is added
    function scrollToBottom() {
      var container = document.getElementById('bot-conversation');
      container.scrollTop = container.scrollHeight;
    }


    //generate response if enter is pressed in textbox
    $scope.sendMessage = function (event, flagEnterClick) {
      //if conversation option is selected
      if ($scope.botType === 'Conversation') {
        if ((event.keyCode === 13 && !event.shiftKey) || flagEnterClick) { // Check if Enter key is pressed
          $scope.conversationMessages.push({ text: $scope.userInput.textVal, type: 'user' });
          scrollToBottom();
          // Process user input and generate a bot response
          delete $scope.userInput.textVal;
          generateBotResponse($scope.conversationMessages);
        }
      }
      //when playbook suggestion is selected
      else {
        if ((event.keyCode === 13 && !event.shiftKey) || flagEnterClick) { // Check if Enter key is pressed
          $scope.playbookSuggestionMessages.push({ text: $scope.userInput.textVal, type: 'user' });
          scrollToBottom();
          var userInput = angular.copy($scope.userInput.textVal);
          $scope.userInput.textVal = ''; // Clear the input field
          // Process user input and generate a bot response
          generatePlaybookDescription(userInput);
          // generateBotResponse($scope.playbookSuggestionMessages);
        }
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
        "useMockOutput": false,
        "globalMock": false
      }
      //trigger playbook and get response when execution is completed
      getDataFromPlaybook($scope.playbookTags.conversation, parametersForPlaybook).then(function (data) {
        // $scope.showDescription = true;
        if (data.result) {
          if (data.result.query_result) {
            $scope.receivingResponse = false;
            $scope.conversationMessages.push({ text: data.result.query_result, type: 'bot' });
            setTimeout(function () {
              scrollToBottom();
            }, 1);
          }
          else {
            $scope.conversationMessages.push({ text: "Playbook Failed", type: 'bot' });
          }
        }
      })
    }

    //when review button is clicked paste the playbook block on pb-designer
    function reviewPlaybook() {
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.playbookSuggestionMessages.push({ text: "Generating playbook steps...", type: 'botGeneral' });
        scrollToBottom();
        $scope.receivingResponse = true;
        var parametersForPlaybook = {
          "input": {},
          "request": {
            "data": {
              "records": [],
              "task_to_automate": $scope.playbookDescription
            }
          },
          "useMockOutput": false,
          "globalMock": false
        }
        
        //trigger playbook and get response when execution is completed
        getDataFromPlaybook($scope.playbookTags.pBDesignerSteps, parametersForPlaybook).then(function (data) {
          if (data.result && data.result.data) {
            $scope.receivingResponse = false;
            $rootScope.$broadcast("designer:addPlaybookElements", data.result.data);
            $scope.close();
            toaster.info('Copied all selected steps');
          }
          else {
            $scope.receivingResponse = false;
            $scope.close();
            toaster.info('Could not fetch result. Please try again.');
          }
        });
      }
    }

    //get JSON playbook description 
    function generatePlaybookDescription(inputText) {
      $scope.processing = true;
      $scope.receivingResponse = true;

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
          "useMockOutput": false,
          "globalMock": false
        }
        getDataFromPlaybook($scope.playbookTags.pBDesignerDescription, parametersForPlaybook).then(function (data) {
          $scope.showDescription = true;
          if (data.result) {
            if (data.result.query_result && data.result.query_result.result) {
              $scope.receivingResponse = false;
              $scope.playbookSuggestionMessages.push({ text: data.result.query_result.result, type: 'bot', generatePlaybook: true });
              $scope.playbookDescription = data.result.query_result.result;
              $scope.connectorNotInstalled = data.result.query_result.result.connectors_not_installed.map(item => item.label);
              setTimeout(function () {
                scrollToBottom();
              }, 1);
            }
            else {
              $scope.receivingResponse = false;
              $scope.playbookFailed = true;
            }
          }
        })
      }
    }

    //trigger respective playbook to either get playbook of conversation text
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
          if ($scope.botType !== "Conversation") {
            $scope.playbookSuggestionMessages.push({ text: "A playbook is triggered to fetch the necessary response...", type: 'botGeneral' });
            scrollToBottom();

          }
          if (result && result.data && result.data.task_id) {
            playbookService.checkPlaybookExecutionCompletion([result.data.task_id], function (response) {
              if ($scope.botType !== "Conversation") {
                $scope.playbookSuggestionMessages.push({ text: "Playbook execution complete", type: 'botGeneral' });
                scrollToBottom();

              }
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

    // if JSON in playbook description is updated
    function updateRichTextHtmlValue(value) {
      if ($scope.payload.pageContext === 'pb_designer') {
        $scope.playbookDescription = value;
      }
    }
  }
})();
