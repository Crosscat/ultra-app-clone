import {
  ConditionalObjectSchema,
  ExplicitObjectSchema,
  ObjectSchemaWithRequirements,
  ObjectSchemaWithDependencies,
  ObjectSchema,
  SchemaOrRef
} from '../json-schema';
import { isRef } from './common';

export const isObjectSchema = (schema: SchemaOrRef): schema is ObjectSchema => {
  return !isRef(schema) && (typeof (schema as ObjectSchema).properties === 'object' || schema.type === 'object');
};

export const isExplicitObjectSchema = (schema: SchemaOrRef): schema is ExplicitObjectSchema => {
  return isObjectSchema(schema) && typeof schema.properties === 'object';
};

export const isConditionalObjectSchema = (schema: ObjectSchema): schema is ConditionalObjectSchema => {
  return typeof schema.if === 'object' && typeof schema.then === 'object';
};

export const hasRequirements = (schema: ObjectSchema): schema is ObjectSchemaWithRequirements => {
  return Array.isArray(schema.required) && schema.required.length > 0;
};

export const hasDependencies = (schema: ObjectSchema): schema is ObjectSchemaWithDependencies => {
  return typeof schema.dependencies === 'object';
};

