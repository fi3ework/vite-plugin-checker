import { text } from './text'

var hello: string = 'Hello'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello + text

export {}
