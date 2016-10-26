# Coconut
Coconut is a password manager built using ipfs.

## Entry format


### Decrypted entry
```
{
  service: <string>,
  username: <string>,
  password: <string>,
  url: <string>,
  notes: <string>
}
```

### Encrypted entry
```
{
  nonce: <string>,
  ciphertext: <dyomh>,
}
```

