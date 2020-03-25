import { ConcreteSchema, NullSchema } from '../json-schema';

export const isNullSchema = (schema: ConcreteSchema): schema is NullSchema => schema.type === 'null';
