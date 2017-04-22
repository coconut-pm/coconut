
mandatory = function() {
    throw new Error('Missing parameter')
}

exit = function(error, exitCode) {
  handleError(error)
  process.exit(exitCode)
}

handleError = function(error) {
  error = error.message || error
  console.error(error)
}

// vim: sw=2

