let Emmiter
;(function () {
  let instance = null
  const events = {}
  Emmiter = function () {
    if (instance) {
      return instance
    }
    instance = this
    this.on = function (name, fn) {
      events[name] ? events[name].push(fn) : (events[name] = [fn])
    }

    this.emit = function (name, ...args) {
      events[name] && events[name].forEach((event) => event && event(...args))
    }
    this.off = function (eventName, fn) {
      const fns = events[eventName]
      for (let i = 0; i < fns.length; i++) {
        const cb = fns[i]
        if (cb === fn || cb.fn === fn) {
          fns.splice(i, 1)
          break
        }
      }
    }
    this.once = function (eventName, fn) {
      function once() {
        this.off(eventName, once)
        fn.apply(this, arguments)
      }
      once.fn = fn
      this.on(eventName, once)
    }
  }
})()

export default Emmiter
