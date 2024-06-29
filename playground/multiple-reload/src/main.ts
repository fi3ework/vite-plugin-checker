import { text } from './text'

var count: string = 0
const hello = 'Hello'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello + text + count

export {}
