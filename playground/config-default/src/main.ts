import { text } from './text'

var hello = 'Hello'

const rootDom = document.querySelector('#root')! as HTMLElement
rootDom.innerHTML = hello + text

export {}
