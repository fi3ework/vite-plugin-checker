export interface User {
  id: number
  name: string
  email?: string
}

export function greet(user: User) {
  return `Hello, ${user.nmae}!`
}
