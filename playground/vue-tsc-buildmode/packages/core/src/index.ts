import { formatMessage, capitalize } from '../../utils/src/helpers';

export function processData(data: string): string {
  return formatMessage(capitalize(data));
}