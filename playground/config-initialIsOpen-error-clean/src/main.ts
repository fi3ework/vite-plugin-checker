import { text } from './text'

const hello = 'Hello'

const rootDom = document.querySelector('#root') as HTMLElement
rootDom.innerHTML = hello + text

export {}
