import { text } from './text'

var count: number = 0
const hello = 'Hello'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello + text + count

export {}
