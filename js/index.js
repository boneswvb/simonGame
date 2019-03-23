// External code included:
// - Class Utilities
// - TimeoutPool Object
// - Counter Object [Dependencies: "Class Utilities"]

// ------------------------------------------------------------

var Quadrant = {
  "green": "green",
  "red": "red",
  "yellow": "yellow",
  "blue": "blue",
};
var orderedQuadrants = [
  Quadrant.green,
  Quadrant.red,
  Quadrant.yellow,
  Quadrant.blue
];

var SimonGameState = {
  "showingQuadrantSequence": "showingQuadrantSequence",
  "acceptingQuadrantSequence": "acceptingQuadrantSequence",
  "notAcceptingQuadrantSequence": "notAcceptingQuadrantSequence"
};

function SimonGame() {
  "use strict";
  
  // Note: Game starts out inactive. You need to reset it to begin a game.
  
  this._gameState = SimonGameState.acceptingQuadrantSequence;
  
  this._quadrantSequence = [];
  
  this._timeoutPool = new TimeoutPool();  // For showing quadrants in the sequence a little at a time.
  
  // Can be an integer or null (only when the game is over). Can be equal to the length of the quadrant sequence.
  this._nextQuadrantSequenceIndexToAccept = null;
  
  this._isInStrictMode = false;
  
  // Callbacks.
  this.onShowingQuadrant = null;
  this.onCompletingShowingQuadrantSequence = null;
}

defineSimonGameMethods();

function defineSimonGameMethods() {
  "use strict";
  
  var prototype = SimonGame.prototype;
  
  prototype._maxQuadrantSequenceLength = 20; // TODO: Should be 20.
  
  prototype.getGameState = function () {
    return this._gameState;
  };
  prototype.isInactive = function () {
    return this._nextQuadrantSequenceIndexToAccept === null;
  };
  
  prototype.getQuadrantSequenceLength = function () {
    return this._quadrantSequence.length;
  };
  
  // Showing and flash durations for quadrants should be:
  // For steps 1 to 4: 800, 300
  // For steps 5 to 8: 733, 300
  // For steps 9 to 12: 667, 300
  // For steps 13 to 20: 600, 300
  prototype.getCurrentQuadrantShowingDuration = function () {
    if (this.getQuadrantSequenceLength() >= 13) {
      return 600;
    }
    else if (this.getQuadrantSequenceLength() >= 9) {
      return 667;
    }
    else if (this.getQuadrantSequenceLength() >= 5) {
      return 733;
    }
    else {
      return 800;
    }
  };
  prototype.getSuggestedCurrentQuadrantFlashDuration = function () {
    if (this.getQuadrantSequenceLength() >= 13) {
      return 300;
    }
    else if (this.getQuadrantSequenceLength() >= 9) {
      return 300;
    }
    else if (this.getQuadrantSequenceLength() >= 5) {
      return 300;
    }
    else {
      return 300;
    }
  };
  
  prototype.isInStrictMode = function () {
    return this._isInStrictMode;
  };
  prototype.setIsInStrictMode = function (isInStrictMode) {
    this._isInStrictMode = isInStrictMode;
  };
  
  function getRandomQuadrant() {
    return orderedQuadrants[Math.floor(Math.random() * 4)];
  }
  
  // Reset methods.
  prototype.resetToNewGame = function () {
    this.resetToClearedInactive();
    
    this._quadrantSequence.push(getRandomQuadrant());
    this._nextQuadrantSequenceIndexToAccept = 0;
  };
  prototype.resetToClearedInactive = function () {
    this.stopShowingQuadrantSequence();
    
    this._quadrantSequence.length = 0;
    this._nextQuadrantSequenceIndexToAccept = null;
  };
  
  // Utilities for showing a sequence of quadrants.
  function showQuadrant(simonGame, quadrantSequenceIndex) {
    var quadrant = simonGame._quadrantSequence[quadrantSequenceIndex];

    if (hasMethod(simonGame, "onShowingQuadrant")) {
      simonGame.onShowingQuadrant(simonGame, quadrant, quadrantSequenceIndex);
    }
  }
  function scheduleNextStepOfQuadrantSequenceShowing(simonGame, quadrantSequenceIndex) {
    simonGame._timeoutPool.scheduleTimeout(function () {
      doNextStepOfQuadrantSequenceShowingAndScheduleNextStepIfNecessary(simonGame, quadrantSequenceIndex);
    }, simonGame.getCurrentQuadrantShowingDuration());
  }
  function getNonShowingQuadrantSequenceState(simonGame) {
    if (simonGame.isInactive()) {
      return SimonGameState.notAcceptingQuadrantSequence;
    }
    else {
      return SimonGameState.acceptingQuadrantSequence;
    }
  }
  function finishShowingQuadrantSequence(simonGame, userInitiated) {
    simonGame._gameState = getNonShowingQuadrantSequenceState(simonGame);
    
    if (hasMethod(simonGame, "onCompletingShowingQuadrantSequence")) {
      simonGame.onCompletingShowingQuadrantSequence(simonGame, userInitiated);
    }
  }
  function doNextStepOfQuadrantSequenceShowingAndScheduleNextStepIfNecessary(simonGame, quadrantSequenceIndex) {
    if (quadrantSequenceIndex < simonGame._quadrantSequence.length) {
      showQuadrant(simonGame, quadrantSequenceIndex);
      scheduleNextStepOfQuadrantSequenceShowing(simonGame, quadrantSequenceIndex + 1);
    }
    else {
      finishShowingQuadrantSequence(simonGame, false);
    }
  }
  
  // Methods for showing a sequence of quadrants.
  prototype.showQuadrantSequence = function () {
    // Make sure we're not showing the sequence.
    this.stopShowingQuadrantSequence();
    
    this._gameState = SimonGameState.showingQuadrantSequence;
    
    doNextStepOfQuadrantSequenceShowingAndScheduleNextStepIfNecessary(this, 0);
  };
  prototype.showQuadrantSequenceAfterDelay = function (delay) {
    // Make sure we're not showing the sequence.
    this.stopShowingQuadrantSequence();
    
    this._gameState = SimonGameState.showingQuadrantSequence;
    
    var thisSimonGame = this;
    this._timeoutPool.scheduleTimeout(function () {
      doNextStepOfQuadrantSequenceShowingAndScheduleNextStepIfNecessary(thisSimonGame, 0);
    }, delay);
  };
  prototype.stopShowingQuadrantSequence = function () {
    if (this.getGameState() === SimonGameState.showingQuadrantSequence) {
      this._timeoutPool.clearPendingTimeouts();

      finishShowingQuadrantSequence(this, true);
      
      return true;
    }
    else {
      return false;
    }
  };
  
  // Methods for inputing a sequence of quadrants.
  prototype.canSelectQuadrant = function () {
    return !this.isInactive() &&
      this._nextQuadrantSequenceIndexToAccept < this._quadrantSequence.length;
  };
  prototype.selectQuadrant = function (quadrant) {
    // Make sure we're not showing the sequence.
    this.stopShowingQuadrantSequence();
    
    if (!this.canSelectQuadrant()) {
      throw "Cannot select a quadrant.";
    }
    
    let targetQuadrant = this._quadrantSequence[this._nextQuadrantSequenceIndexToAccept];
    if (quadrant === targetQuadrant) {
      this._nextQuadrantSequenceIndexToAccept += 1;
      
      return true;
    }
    else {
      if (this.isInStrictMode()) {
        // Start game all over again.
        this.resetToNewGame();
      }
      else {
        // Start quadrant selection process all over again.
        this._nextQuadrantSequenceIndexToAccept = 0;
      }
      
      return false;
    }
  };
  prototype.commitQuadrantSequenceSelection = function () {
    // Make sure we're not showing the sequence.
    this.stopShowingQuadrantSequence();
    
    if (this.isInactive()) {
      return false;
    }
    else if (this._nextQuadrantSequenceIndexToAccept < this._quadrantSequence.length) {
      return false;
    }
    else if (this._nextQuadrantSequenceIndexToAccept === this._quadrantSequence.length) {
      if (this._quadrantSequence.length < prototype._maxQuadrantSequenceLength) {
        // Move onto next round.
        
        this._quadrantSequence.push(getRandomQuadrant());

        this._nextQuadrantSequenceIndexToAccept = 0;
      }
      else {
        // Won game!
        
        this._nextQuadrantSequenceIndexToAccept = null;
        
        this._gameState = SimonGameState.notAcceptingQuadrantSequence;
      }
      
      return true;
    }
    else {
      throw "Unexpected state for Simon game: The index of the quadrant sequence should not exceed the length.";
    }
  };
  
  // Methods for cheating.
  prototype.getHintAboutQuadrantToSelect = function () {
    if (!this.canSelectQuadrant()) {
      throw "No next quadrant to select.";
    }
    
    if (this.isInStrictMode()) {
      // No hints in strict mode!
      return null;
    }
    else {
      let targetQuadrant = this._quadrantSequence[this._nextQuadrantSequenceIndexToAccept];
      
      return targetQuadrant;
    }
  };
  prototype.instaWin = function () {
    if (this.isInStrictMode()) {
      // No insta-win in strict mode!
      return false;
    }
    else {
      if (!this.isInactive()) {
        // Make sure we're not showing the sequence.
        this.stopShowingQuadrantSequence();

        // Fill up the quadrant sequence to that of the last round.
        while (this.getQuadrantSequenceLength() < prototype._maxQuadrantSequenceLength) {
          this._quadrantSequence.push(getRandomQuadrant());
        }

        // Simulate winning the last round.

        this._nextQuadrantSequenceIndexToAccept = null;

        this._gameState = SimonGameState.notAcceptingQuadrantSequence;
        
        return true;
      }
      else {
        return false;
      }
    }
  };
}

// ------------------------------------------------------------

// Used to model pressing and releasing a button.
// The button can be held down by pressing on it multiple times.
// It becomes no longer held down when it is released for each time it was pressed.
function ButtonModel() {
  "use strict";
  
  this._buttonHoldCounter = new Counter();
  
  var thisButtonModel = this;
  
  this._buttonHoldCounter.onCountTurningNonZero = function (counter, previousCount, optionalUserArgs) {
    if (hasMethod(thisButtonModel, "onFirstButtonPress")) {
      thisButtonModel.onFirstButtonPress(thisButtonModel, optionalUserArgs);
    }
  };
  
  this._buttonHoldCounter.onCountTurningZero = function (counter, previousCount, optionalUserArgs) {
    if (hasMethod(thisButtonModel, "onLastButtonRelease")) {
      thisButtonModel.onLastButtonRelease(thisButtonModel, optionalUserArgs);
    }
  };
  
  this.onFirstButtonPress = null;
  this.onLastButtonRelease = null;
}

defineButtonModelMethods();

function defineButtonModelMethods() {
  "use strict";
  
  var prototype = ButtonModel.prototype;
  
  prototype.pressButton = function (optionalUserArgs) {
    this._buttonHoldCounter.incrementCount(1, optionalUserArgs);
  };
  prototype.releaseButton = function (optionalUserArgs) {
    this._buttonHoldCounter.incrementCount(-1, optionalUserArgs);
  };
  
  prototype.buttonIsHeldDown = function () {
    return this._buttonHoldCounter.getCount() > 0;
  };
}

// ------------------------------------------------------------

var quadrantsToElementIds = {};
quadrantsToElementIds[Quadrant.green] = "green-quadrant";
quadrantsToElementIds[Quadrant.red] = "red-quadrant";
quadrantsToElementIds[Quadrant.yellow] = "yellow-quadrant";
quadrantsToElementIds[Quadrant.blue] = "blue-quadrant";

var elementIdsToQuadrants = {
  "green-quadrant": Quadrant.green,
  "red-quadrant": Quadrant.red,
  "yellow-quadrant": Quadrant.yellow,
  "blue-quadrant": Quadrant.blue
};

var quadrantElementIdsToAudioElementIds = {
  "green-quadrant": "sound1",
  "red-quadrant": "sound2",
  "yellow-quadrant": "sound3",
  "blue-quadrant": "sound4"
};

function playSoundForQuadrantElementId(quadrantElementId) {
  "use strict";
  
  let audioElementId = quadrantElementIdsToAudioElementIds[quadrantElementId];
  document.getElementById(audioElementId).play();
}
function playErrorSound() {
  "use strict";
  
  document.getElementById("error-sound").play();
}
function playVictorySound() {
  "use strict";
  
  document.getElementById("victory-sound").play();
}
function playDeniedSound() {
  "use strict";
  
  document.getElementById("denied-sound").play();
}

function SimonGameScreenController() {
  "use strict";
  
  var _setupDoneFlag = false;
  
  var _simonGame = new SimonGame();
  
  setupSimonGame();
  
  function setupSimonGame() {
    // Setup callbacks.

    _simonGame.onShowingQuadrant = function (simonGame, quadrant, quadrantSequenceIndex) {
      var quadrantElementId = quadrantsToElementIds[quadrant];
      var buttonModel = quadrantElementIdsToButtonModels[quadrantElementId];
      
      playSoundForQuadrantElementId(quadrantElementId);
      
      buttonModel.pressButton();
      setTimeout(function () {
        buttonModel.releaseButton();
      }, simonGame.getSuggestedCurrentQuadrantFlashDuration());
    };

    _simonGame.onCompletingShowingQuadrantSequence = function (simonGame, userInitiated) {

    };
  }
  
  var quadrantElementIdsToButtonModels = {
    "green-quadrant": new ButtonModel(),
    "red-quadrant": new ButtonModel(),
    "yellow-quadrant": new ButtonModel(),
    "blue-quadrant": new ButtonModel()
  };
  
  var buttonModelsToQuadrantElementIds = new Map();
  // Initialize mapping from button models to quadrant element IDs.
  for (let quadrantElementId of Object.keys(quadrantElementIdsToButtonModels)) {
    let buttonModel = quadrantElementIdsToButtonModels[quadrantElementId];

    buttonModelsToQuadrantElementIds.set(buttonModel, quadrantElementId);
  }
  
  setupButtonModels();
  
  function setupButtonModels() {
    // Setup callbacks.
    
    function onFirstButtonPress(buttonModel, optionalUserArgs) {
      let quadrantElementId = buttonModelsToQuadrantElementIds.get(buttonModel);

      document.getElementById(quadrantElementId).classList.add("highlighted");
    }
    
    function onLastButtonRelease(buttonModel, optionalUserArgs) {
      let quadrantElementId = buttonModelsToQuadrantElementIds.get(buttonModel);

      document.getElementById(quadrantElementId).classList.remove("highlighted");
    }

    for (let buttonModel of buttonModelsToQuadrantElementIds.keys()) {
      buttonModel.onFirstButtonPress = onFirstButtonPress;
      buttonModel.onLastButtonRelease = onLastButtonRelease;
    }
  }
  
  function updateQuadrantSequenceLengthDisplay() {
    let sequenceLengthDisplayString;
    if (_simonGame.getQuadrantSequenceLength() > 0) {
      sequenceLengthDisplayString = _simonGame.getQuadrantSequenceLength().toString();
    }
    else {
      sequenceLengthDisplayString = "Press “Start” to play.";
    }
    
    document.getElementById("text-display").innerHTML = sequenceLengthDisplayString;
  }
  
  this.setup = function () {
    function flashButtonsWithCompletion(buttonModels, optionalUserArgs, flashDuration, completion) {
      for (let buttonModel of buttonModels) {
        buttonModel.pressButton(optionalUserArgs);
      }
      setTimeout(function () {
        for (let buttonModel of buttonModels) {
          buttonModel.releaseButton();
        }

        if (completion !== null && completion !== undefined) {
          completion();
        }
      }, flashDuration);
    }

    function flashButtonsAfterDelayWithCompletion(buttonModels, optionalUserArgs,
                                                   flashDuration, delay, completion)
    {
      setTimeout(function () {
        flashButtonsWithCompletion(buttonModels, optionalUserArgs, flashDuration, completion);
      }, delay);
    }
    
    function buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, startIndex,
                                                        flashDuration, betweenFlashesDuration,
                                                        completion)
    {
      if (startIndex < quadrantElementIdsSequence.length) {
        let quadrantElementIds = quadrantElementIdsSequence[startIndex];
        
        let buttonModels = quadrantElementIds.map(function (quadrantElementId) {
          return quadrantElementIdsToButtonModels[quadrantElementId];
        });

        let subsequentCompletion =
            buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, startIndex + 1,
                                                      flashDuration, betweenFlashesDuration,
                                                      completion);
        
        if (startIndex === 0) {
          return function () {
            flashButtonsWithCompletion(buttonModels, null, flashDuration, subsequentCompletion);
          };
        }
        else {
          if (betweenFlashesDuration === 0) {
            return function () {
              flashButtonsWithCompletion(buttonModels, null, flashDuration, subsequentCompletion);
            };
          }
          else {
            return function () {
              flashButtonsAfterDelayWithCompletion(buttonModels, null,
                                                   flashDuration, betweenFlashesDuration,
                                                   subsequentCompletion);
            };
          }
        }
      }
      else {
        return completion;
      }
    }
    
    function flashButtonsForNewGame(completion) {
      // Flash buttons in some sequence.
      
      var flashDuration = 50;
      var betweenFlashesDuration = 10;
      
      var quadrantElementIdsSequence = [
        ["green-quadrant"],
        ["red-quadrant"],
        ["blue-quadrant"],
        ["yellow-quadrant"],
        
        ["green-quadrant"],
        ["red-quadrant"],
        ["blue-quadrant"],
        ["yellow-quadrant"]
      ];
      
      var flashSequenceAction = buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, 0,
                                                                          flashDuration, betweenFlashesDuration,
                                                                          completion);
      if (flashSequenceAction !== null && flashSequenceAction !== undefined) {
        flashSequenceAction();
      }
    }
    
    function flashButtonsAfterWinningGame(completion) {
      // Flash buttons in some sequence.
      
      var flashDuration = 150;
      var betweenFlashesDuration = 100;
      
      var quadrantElementIdsSequence = [
        ["green-quadrant"],
        ["red-quadrant"],
        ["blue-quadrant"],
        ["yellow-quadrant"],
        
        ["green-quadrant", "red-quadrant", "blue-quadrant", "yellow-quadrant"],
        ["red-quadrant", "yellow-quadrant"],
        ["green-quadrant", "blue-quadrant"],
        ["green-quadrant", "red-quadrant", "blue-quadrant", "yellow-quadrant"],
        
        [],
        [],
        
        ["green-quadrant", "blue-quadrant"],
        ["red-quadrant", "yellow-quadrant"]
      ];
      
      var flashSequenceAction = buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, 0,
                                                                          flashDuration, betweenFlashesDuration,
                                                                          completion);
      if (flashSequenceAction !== null && flashSequenceAction !== undefined) {
        flashSequenceAction();
      }
    }
    
    function notifyWinningGame(completion) {
      playVictorySound();

      flashButtonsAfterWinningGame(completion);
    }
    
    function pressButtonNormally(buttonModel, completion) {
      var buttonPressDuration = 500;
      
      var quadrantElementId = buttonModelsToQuadrantElementIds.get(buttonModel);
      playSoundForQuadrantElementId(quadrantElementId);
      
      // Flash button in response to button press.
      flashButtonsWithCompletion([buttonModel], null, buttonPressDuration, completion);
    }

    function pressButtonWithError(buttonModel, completionAfterShowingError) {
      playErrorSound();
      
      // Flash button three times.
      
      var flashDuration = 200;
      var betweenFlashesDuration = 100;
      
      let quadrantElementId = buttonModelsToQuadrantElementIds.get(buttonModel);
      
      var quadrantElementIdsSequence = [
        [quadrantElementId],
        [quadrantElementId],
        [quadrantElementId]
      ];

      var flashSequenceAction = buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, 0,
                                                                          flashDuration, betweenFlashesDuration,
                                                                          completionAfterShowingError);
      if (flashSequenceAction !== null && flashSequenceAction !== undefined) {
        flashSequenceAction();
      }
    }

    var delayBeforeShowingQuadrantSequence = 1500;
    var delayBeforeUpdatingQuadrantSequenceLengthDisplay = delayBeforeShowingQuadrantSequence / 2;
    
    function quadrantClickEventHandler(event) {
      // Note: The general flow of this code is to update the model immediately
      // and to update the view after the button pressing is done
      // (i.e., updating the view is delayed).
      
      var quadrant = elementIdsToQuadrants[event.target.id];

      var buttonModel = quadrantElementIdsToButtonModels[event.target.id];

      if (_simonGame.canSelectQuadrant()) {
        let selectionIsCorrect = _simonGame.selectQuadrant(quadrant);

        if (selectionIsCorrect) {
          // Finished selecting the sequence of quadrants correctly?
          let completionAfterPressingButton = null;
          if (!_simonGame.canSelectQuadrant()) {
            // Update model.
            
            _simonGame.commitQuadrantSequenceSelection();
            
            completionAfterPressingButton = function () {
              if (_simonGame.isInactive()) {
                // Won game.
                
                setTimeout(function () {
                  notifyWinningGame(function () {
                    // Update model.
                    _simonGame.resetToClearedInactive();

                    // Update view after delay.
                    setTimeout(function () {
                      updateQuadrantSequenceLengthDisplay();
                    }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
                  });
                  
                  // Update view.
                  updateQuadrantSequenceLengthDisplay();
                }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
              }
              else {
                // Next round.
                
                // Update view after delay.
                setTimeout(function () {
                  updateQuadrantSequenceLengthDisplay();
                }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
                
                _simonGame.showQuadrantSequenceAfterDelay(delayBeforeShowingQuadrantSequence);
              }
            };
          }

          pressButtonNormally(buttonModel, completionAfterPressingButton);
        }
        else {
          let gameWasRestarted = _simonGame.isInStrictMode();
          
          pressButtonWithError(buttonModel, function () {
            if (gameWasRestarted) {
              // Update view after delay.
              setTimeout(function () {
                updateQuadrantSequenceLengthDisplay();
              }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
            }
            
            _simonGame.showQuadrantSequenceAfterDelay(delayBeforeShowingQuadrantSequence);
          });
        }
      }
    }

    if (!_setupDoneFlag) {
      _setupDoneFlag = true;
      
      var quadrants = document.getElementsByClassName("quadrant");
      for (let i = 0; i < quadrants.length; ++i) {
        let quadrant = quadrants[i];

        quadrant.addEventListener("click", quadrantClickEventHandler);
      }
      
      document.getElementById("start").addEventListener("click", function (event) {
        // Update model.
        
        _simonGame.resetToNewGame();
        
        flashButtonsForNewGame(function () {
          // Update view after delay.
          setTimeout(function () {
            updateQuadrantSequenceLengthDisplay();
          }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
          
          _simonGame.showQuadrantSequenceAfterDelay(delayBeforeShowingQuadrantSequence);
        });
      });
      
      document.getElementById("strict-mode").addEventListener("change", function (event) {
        _simonGame.setIsInStrictMode(event.target.checked);
      });
      
      // Update view.
      
      updateQuadrantSequenceLengthDisplay();
    }
    
    document.getElementById("show-hint").addEventListener("click", function (event) {
      if (_simonGame.canSelectQuadrant() &&
          !_simonGame.isInStrictMode())
      {
        _simonGame.stopShowingQuadrantSequence();
        
        let nextQuadrant = _simonGame.getHintAboutQuadrantToSelect();
        if (nextQuadrant !== null) {
          let quadrantElementId = quadrantsToElementIds[nextQuadrant];

          var flashDuration = 200;
          var betweenFlashesDuration = 100;

          var quadrantElementIdsSequence = [
            [quadrantElementId],
            [quadrantElementId]
          ];

          var flashSequenceAction = buildButtonFlashingSequenceWithCompletion(quadrantElementIdsSequence, 0,
                                                                              flashDuration, betweenFlashesDuration,
                                                                              null);
          if (flashSequenceAction !== null && flashSequenceAction !== undefined) {
            flashSequenceAction();
          }
        }
        else {
          playDeniedSound();
        }
      }
      else {
        playDeniedSound();
      }
    });
    
    document.getElementById("insta-win").addEventListener("click", function (event) {
      if (!_simonGame.isInactive()) {
        let success = _simonGame.instaWin();
        if (success) {
          notifyWinningGame(function () {
            // Update model.
            _simonGame.resetToClearedInactive();
            
            // Update view after delay.
            setTimeout(function () {
              updateQuadrantSequenceLengthDisplay();
            }, delayBeforeUpdatingQuadrantSequenceLengthDisplay);
          });
          
          // Update view.
          updateQuadrantSequenceLengthDisplay();
        }
        else {
          playDeniedSound();
        }
      }
      else {
        playDeniedSound();
      }
    });
  };
}

// ------------------------------------------------------------

var simonGameScreenController = new SimonGameScreenController();

$(document).ready(function () {
  "use strict";
  
  simonGameScreenController.setup();
});