export function formatMessage(message: string): string {
  return `[Utils] ${message}`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function processData(input: number): string {
  return input.toString();
}