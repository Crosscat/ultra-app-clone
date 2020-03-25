import { ArraySchema, ConcreteSchema } from '../json-schema';

export const isArraySchema = (schema: ConcreteSchema): schema is ArraySchema => schema.type === 'array';
