import { window, StatusBarAlignment, StatusBarItem } from "vscode";
import { SessionStatus } from "./session-status";
import { Timer } from "./timer";

class SessionManager {
  constructor(configuration) {
    this._timer = new Timer();
    this._currentStatus = SessionStatus.None;
    this._sessionsCompleted = 0;
    this._autoStartNextSession = configuration.autoStartNextSession;

    // create status bar items
    if (!this._statusBarText) {
      this._statusBarText = window.createStatusBarItem(StatusBarAlignment.Left);
      this._statusBarText.show();
    }
    if (!this._statusBarStartButton) {
      this._statusBarStartButton = window.createStatusBarItem(
        StatusBarAlignment.Left
      );
      this._statusBarStartButton.text = "$(triangle-right)";
      this._statusBarStartButton.command = "extension.startSession";
      this._statusBarStartButton.tooltip = "Start Session";
    }
    if (!this._statusBarPauseButton) {
      this._statusBarPauseButton = window.createStatusBarItem(
        StatusBarAlignment.Left
      );
      this._statusBarPauseButton.text = "$(primitive-square)";
      this._statusBarPauseButton.command = "extension.pauseSession";
      this._statusBarPauseButton.tooltip = "Pause Session";
    }

    this.reset();
    this.draw();
  }

  update() {
    // handle launch of the next session
    if (this._currentStatus === SessionStatus.Done) {
      this._sessionsCompleted++;
    }
    if (this._currentStatus === SessionStatus.Work) {
      this._currentStatus = SessionStatus.Break;
    } else {
      this._currentStatus = SessionStatus.Work;
    }
  }

  draw() {
    if (this.isSessionFinished) {
      // show text when all Pomodoro sessions are over
      this._statusBarText.text = "session over, start again ?";
      this._statusBarStartButton.show();
      this._statusBarPauseButton.hide();

      // show message if user needs a longer break
      if (this.pomodori.length > 1) {
        window.showInformationMessage(
          "Well done ! You should now take a longer break."
        );
      }

      return;
    }

    let seconds = this.currentPomodoro.timer.currentTime % 60;
    let minutes = (this.currentPomodoro.timer.currentTime - seconds) / 60;

    // update status bar (text)
    let timerPart =
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (seconds < 10 ? "0" : "") +
      seconds;

    let statusPart = "";
    if (this.currentPomodoro.status == PomodoroStatus.Work) {
      statusPart += " - work";
    }
    if (this.currentPomodoro.status == PomodoroStatus.Pause) {
      statusPart += " - pause";
    }

    let pomodoroNumberPart = "";
    if (this.pomodori.length > 1) {
      pomodoroNumberPart +=
        " (" +
        (this._pomodoroIndex + 1) +
        " out of " +
        this.pomodori.length +
        " pomodori)";
    }

    this._statusBarText.text = timerPart + statusPart + pomodoroNumberPart;

    // update status bar (buttons visibility)
    if (
      this.currentPomodoro.status == PomodoroStatus.None ||
      this.currentPomodoro.status == PomodoroStatus.Wait
    ) {
      this._statusBarStartButton.show();
      this._statusBarPauseButton.hide();
    } else {
      this._statusBarStartButton.hide();
      this._statusBarPauseButton.show();
    }

    this._statusBarText.show();
  }

  start() {
    this._timer.start(() => {
      // stop the timer if no second left
      if (this._timer.currentTime <= 0) {
        if (this._currentStatus == SessionStatus.Work) {
          window.showInformationMessage(
            "Great Work! Now let's give your eyes some break."
          );
        } else if (this.status == SessionStatus.Break) {
          window.showInformationMessage(
            "Eyes rested! You can resume work now."
          );
          this._currentStatus = SessionStatus.Done;
        }
        this.update();
        this.start();
      }

      if (this.ontick) {
        this.ontick();
      }
    });
  }

  pause() {
    this.currentPomodoro.pause();
  }

  reset() {
    this._pomodoroIndex = 0;
    this.pomodori = [];

    if (!this.configuration || this.configuration.length < 1) {
      // create a single Pomodoro by default
      this.pomodori.push(new Pomodoro());
    } else {
      // create a new collection of Pomodori
      const minutesPerHour = 60;
      for (let i = 0; i < this.configuration.length; i++) {
        let pomodoro = new Pomodoro(
          this.configuration[i].work * minutesPerHour,
          this.configuration[i].pause * minutesPerHour
        );
        this.pomodori.push(pomodoro);
      }
    }
  }

  dispose() {
    // stop current Pomodoro
    this.currentPomodoro.dispose();

    // reset Pomodori
    this.reset();

    // reset UI
    this._statusBarText.dispose();
    this._statusBarStartButton.dispose();
    this._statusBarPauseButton.dispose();
  }
}

module.exports = { SessionManager };
