import {
  AllOfSchema,
  AnyOfSchema,
  ConcreteSchema,
  ConstSchema,
  EnumSchema,
  NotSchemaSchema,
  OneOfSchema, Ref,
  Schema, SchemaOrRef
} from '../json-schema';

export const isAnyOfSchema = (schema: Schema): schema is AnyOfSchema => Array.isArray(schema.anyOf);

export const isOneOfSchema = (schema: Schema): schema is OneOfSchema => Array.isArray(schema.oneOf);

export const isAllOfSchema = (schema: Schema): schema is AllOfSchema => Array.isArray(schema.allOf);

export const isNotSchemaSchema = (schema: Schema): schema is NotSchemaSchema => typeof schema.not === 'object';

export const isConstSchema = (schema: Schema): schema is ConstSchema => typeof schema.const !== 'undefined';

export const isEnumSchema = (schema: Schema): schema is EnumSchema => Array.isArray(schema.enum);

export const isRef = (schema: SchemaOrRef): schema is Ref => (schema as Ref).$ref != null;

export const isConcreteSchema = (schema: SchemaOrRef): schema is ConcreteSchema => !isRef(schema);
