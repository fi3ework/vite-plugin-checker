import { text } from './text'

var hello1: number = 'Hello1'
var hello2: boolean = 'Hello2'

const rootDom = document.querySelector('#root')!
rootDom.innerHTML = hello1 + text

export {}
