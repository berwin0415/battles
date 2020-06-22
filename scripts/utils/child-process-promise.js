const child_process = require('child_process')

module.exports = {
  exec,
  execFile,
}

const slice = Array.prototype.slice

class ChildProcessPromise extends Promise {
  constructor(executor) {
    let resolve
    let reject

    super((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject

      if (executor) {
        executor(resolve, reject)
      }
    })

    this._cpResolve = resolve
    this._cpReject = reject
    this.childProcess = undefined
  }
  progress(callback) {
    process.nextTick(() => {
      callback(this.childProcess)
    })

    return this
  }
  then(onFulfilled, onRejected) {
    var newPromise = super.then(onFulfilled, onRejected)
    newPromise.childProcess = this.childProcess
    return newPromise
  }

  catch(onRejected) {
    var newPromise = super.catch(onRejected)
    newPromise.childProcess = this.childProcess
    return newPromise
  }

  done() {
    this.catch((e) => {
      process.nextTick(() => {
        throw e
      })
    })
  }
}

ChildProcessPromise.prototype.fail = ChildProcessPromise.prototype.catch

class ChildProcessError extends Error {
  constructor(message, code, childProcess, stdout, stderr) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.code = code
    this.childProcess = childProcess
    this.stdout = stdout
    this.stderr = stderr
  }
}

function doExec(method, args) {
  let cp
  let cpPromise = new ChildProcessPromise()
  var reject = cpPromise._cpReject
  var resolve = cpPromise._cpResolve

  var finalArgs = slice.call(args, 0)
  finalArgs.push(callback)

  cp = child_process[method].apply(child_process, finalArgs)

  function callback(err, stdout, stderr) {
    if (err) {
      var commandStr =
        args[0] + (Array.isArray(args[1]) ? ' ' + args[1].join(' ') : '')
      err.message +=
        ' `' + commandStr + '` (exited with error code ' + err.code + ')'
      err.stdout = stdout
      err.stderr = stderr
      var cpError = new ChildProcessError(
        err.message,
        err.code,
        child_process,
        stdout,
        stderr
      )
      reject(cpError)
    } else {
      resolve({
        childProcess: cp,
        stdout: stdout,
        stderr: stderr,
      })
    }
  }

  cpPromise.childProcess = cp

  return cpPromise
}

/**
 * `exec` as Promised
 *
 * @param {String} command
 * @param {Object} options
 * @return {Promise}
 */
function exec() {
  return doExec('exec', arguments)
}

/**
 * `execFile` as Promised
 *
 * @param {String} command
 * @param {Array} args
 * @param {Object} options
 * @return {Promise}
 */
function execFile() {
  return doExec('execFile', arguments)
}
