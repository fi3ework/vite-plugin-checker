import { fetchUser } from './api'
import { greet } from './user'

var app = document.querySelector('#app')!
const user = await fetchUser(1)

app.textContent = greet(user)
