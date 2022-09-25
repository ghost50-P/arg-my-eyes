export class Timer {
  get isRunning() {
    return this._timerId != 0;
  }

  constructor(currentTime = 0, interval = 1000) {
    this._timerId = 0;
  }

  reset(time) {
    this.stop();
    this.currentTime = time;
  }

  start(callback) {
    if (this._timerId == 0) {
      this._timerId = setInterval(() => {
        this.tick();
        callback();
      }, this.interval);
    } else {
      console.error("A timer instance is already running...");
    }
  }

  stop() {
    if (this._timerId != 0) {
      clearInterval(this._timerId);
    }

    this._timerId = 0;
  }

  tick() {
    this.currentTime -= this.interval / 1000;
  }
}
