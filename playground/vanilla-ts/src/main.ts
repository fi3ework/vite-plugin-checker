import { text } from './text'

var hello = 'Hello'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello + text

export {}
