import { text } from './text'

let count: string = 0
var hello = 'Hello'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello + text

export {}
