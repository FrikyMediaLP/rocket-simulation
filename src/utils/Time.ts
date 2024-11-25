export function getHighPerformanceTime() {
  if (window.performance.now) {
    return function() { return window.performance.now(); };
  } else {
    if (window.performance.webkitNow) {
      return function() { return window.performance.webkitNow(); };
    } else {
      return function() { return new Date().getTime(); };
    }
  }
}

export function getFormattedTime(seconds: number) {
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;

  let _seconds = seconds + '';
  let _minutes = minutes + '';
  let _hours = hours + '';

  if(seconds < 10) _seconds = '0' + _seconds;
  if(minutes < 10) _minutes = '0' + _minutes;
  if(hours < 10) _hours = '0' + _hours;

  return {hours: _hours, minutes: _minutes, seconds: _seconds};
}
