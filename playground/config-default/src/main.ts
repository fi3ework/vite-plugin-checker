import { text } from './text'

const hello = 'Hello'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const rootDom = document.querySelector('#root')! as HTMLElement
rootDom.innerHTML = hello + text

export {}
