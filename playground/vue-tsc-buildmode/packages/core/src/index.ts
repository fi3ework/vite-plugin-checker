import { formatMessage, capitalize, processData as utilsProcessData } from '../../utils/src/helpers';

export function processData(data: string): string {
  const processed = utilsProcessData(data);
  return formatMessage(capitalize(processed));
}