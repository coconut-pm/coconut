let coconut
let modifyFunction

window.onload = () => {
  document.forms.server.server.value = localStorage.getItem('server')
}

function passwordEntered(form) {
  let password = form.password.value
  coconut = new Coconut(password)

  syncHash()
    .then(openCoconut)
    .catch(() => {
      let hash = localStorage.getItem('hash')
      openCoconut(hash)
    })

  return false
}

function openCoconut(hash) {
  if (hash) {
    coconut.connect(hash)
      .then(() => {
        document.querySelector('#incorrectPassword').textContent = ''
        list()
      }).catch(() => {
        document.querySelector('#incorrectPassword').textContent = 'Wrong password'
      })
  }
}

function syncHash() {
  return new Promise((resolve, reject) => {
    let url = localStorage.getItem('server') + "?password=" + coconut.passwordHash
    let http = new XMLHttpRequest()
    http.open("GET", url, true)
    http.onreadystatechange = () => {
      if (http.readyState == 4) {
        if (http.status == 200) {
          resolve(http.responseText.trim())
        } else {
          reject()
        }
      }
    }
    http.send()
  })
}

function updateHash() {
  let hash = coconut.hash
  let password = coconut.passwordHash
  let server = localStorage.getItem('server')

  localStorage.setItem('hash', hash)

  let http = new XMLHttpRequest();
  var params = "hash=" + hash + "&password=" + password;
  http.open("POST", server, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.send(params);
}

function list() {
  document.querySelector('ul').innerHTML =
    `${coconut.entries.map(listItem).join('\n')}`
}

function listItem(entry) {
  let title = `<a href="#" onclick="show(\'${entry.hash}\')">${entry.value.service}</a>`
  let edit = `<a href="#" onclick="edit(\'${entry.hash}\')">✎</a>`
  let remove = `<a href="#" onclick="remove(\'${entry.hash}\')">✖</a>`
  return `<li>${title} ${edit} ${remove}</li>`
}

function add() {
  modifyFunction = coconut.addEntry.bind(coconut)
}

function edit(hash) {
  modifyFunction = coconut.updateEntry.bind(coconut, hash)
}

function remove(hash) {
  coconut.remove(hash)
    .then(modified)
}

function doModify(form) {
  modifyFunction(
    form.service.value,
    form.username.value,
    form.password.value,
    form.url.value,
    form.notes.value
  ).then(modified)

  return false
}

function modified() {
  updateHash()
  list()
}

function show(hash) {
  let entry = coconut.get(hash).value
  document.querySelector('#service').textContent = entry.service
  document.querySelector('#username').textContent = entry.username
  document.querySelector('#url').textContent = entry.url
  document.querySelector('#notes').textContent = entry.notes
}

function setServer(form) {
  localStorage.setItem('server', form.server.value)
  return false
}

// vim: sw=2

