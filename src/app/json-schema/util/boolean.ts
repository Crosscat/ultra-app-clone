import { BooleanSchema, ConcreteSchema } from '../json-schema';

export const isBooleanSchema = (schema: ConcreteSchema): schema is BooleanSchema => schema.type === 'boolean';
