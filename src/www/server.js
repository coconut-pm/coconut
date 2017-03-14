const path = require('path'),
      express = require('express'),
      serveStatic = require('serve-static')

const app = express()

app.use('/modules', serveStatic(path.resolve('../../node_modules/')))
app.use('/core', serveStatic(path.resolve('../core/')))
app.use('/', serveStatic(path.resolve('static/')))
app.use('/', serveStatic(path.resolve('resources/')))

app.listen(8081, () => {
  console.log('Server running on port 8081.')
})

// vim: sw=2

