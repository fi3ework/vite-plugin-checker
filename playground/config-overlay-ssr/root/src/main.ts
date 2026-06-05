import { text } from './text'

// Intentional type error: `string` is not assignable to `number` (TS2322).
const hello: number = 'Hello'

const rootDom = document.querySelector('#root')! as HTMLElement
rootDom.innerHTML = hello + text

export {}
