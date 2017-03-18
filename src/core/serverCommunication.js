if (typeof window === 'undefined') {
  request = require('request')
}

function get(server, passwordHash) {
  let url = server + "?password=" + passwordHash
  if (typeof window === 'undefined') {
    return node_get(url)
  } else {
    return browser_get(url)
  }
}

function node_get(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200 && body !== '') {
        resolve(body.trim())
      } else {
        reject()
      }
    })
  })
}

function browser_get(url) {
  return new Promise((resolve, reject) => {
    let http = new XMLHttpRequest()
    http.open("GET", url, true)
    http.onreadystatechange = () => {
      if (http.readyState == 4) {
        if (http.status == 200 && http.responseText !== '') {
          resolve(http.responseText.trim())
        } else {
          reject()
        }
      }
    }
    http.send()
  })
}

function post(url, passwordHash, hash) {
  let params = { hash, password: passwordHash }
  if (typeof window === 'undefined') {
    return node_post(url, params)
  } else {
    return browser_post(url, params)
  }
}

function node_post(url, params) {
  return new Promise((resolve, reject) => {
    request.post({ url: url, form: params }, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

function browser_post(url, params) {
  return new Promise((resolve, reject) => {
    let http = new XMLHttpRequest();
    params = "hash=" + params.hash + "&password=" + params.password;
    http.open("POST", url, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        resolve()
      } else {
        reject()
      }
    }
    http.send(params);
  })
}

if (typeof window === 'undefined') {
  module.exports = { get, post }
} else {
  serverCommunication = { get, post }
}

// vim: sw=2

