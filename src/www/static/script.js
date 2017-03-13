let coconut

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

function add(service, username, password, url, notes) {
  if (!coconut) {
    return;
  }
  coconut.addEntry(...arguments)
    .then(() => {
      localStorage.setItem('hash', coconut.hash)
    })
}

function list() {
  if (!coconut) {
    return;
  }
  document.querySelector('ul').innerHTML =
    `${coconut.entries.map(entry => {
      return `<li>${entry.value.service}</li>`
    }).join('\n')}`
}

// vim: sw=2

