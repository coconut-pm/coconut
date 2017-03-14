let coconut
let modifyFunction

function passwordEntered(form) {
  let password = form.password.value
  coconut = new Coconut(password)

  let hash = localStorage.getItem('hash')
  if (hash) {
    coconut.connect(hash)
      .then(() => {
        document.querySelector('#incorrectPassword').textContent = ''
        list()
      }).catch(() => {
        document.querySelector('#incorrectPassword').textContent = 'Wrong password'
      })
  }

  return false
}

function updateHash() {
  localStorage.setItem('hash', coconut.hash)
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

function doModify() {
  modifyFunction(
    document.forms.modify.service.value,
    document.forms.modify.username.value,
    document.forms.modify.password.value,
    document.forms.modify.url.value,
    document.forms.modify.notes.value
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

// vim: sw=2

