import type { User } from './user'

export async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data: any = await response.json()
  return { id: data.id, name: data.name, email: data.email ?? null }
}
