export function greet(name: string): string {
  return `Hello, ${name}!`
}

const count: number = 'not a number'

document.querySelector('#app')!.textContent = greet('Vite') + count
