import {
  ConcreteSchema,
  DateOrTimeSchema,
  DateSchema,
  FormatSchema,
  PatternSchema,
  StringFormat,
  StringSchema,
  TimeSchema
} from '../json-schema';

const uniqueStringSchemaAttributes: Array<keyof StringSchema> = [
  'pattern',
  'format',
  'maxLength',
  'minLength'
];

export const isStringSchema = (schema: ConcreteSchema): schema is StringSchema => {
  if (schema.type === 'string') {
    return true;
  } else if (uniqueStringSchemaAttributes.some((attr) => (schema as object).hasOwnProperty(attr))) {
    return true;
  } else if (typeof schema.default === 'string' || typeof schema.const === 'string') {
    return true;
  }
  return false;
};

const dateOrTimeFormats: Array<StringFormat> = ['date-time', 'date', 'time'];

export const isPatternSchema = (schema: StringSchema): schema is PatternSchema => schema.pattern != null;

export const isFormatSchema = (schema: StringSchema): schema is FormatSchema => hasFormat(schema);

export const isDateTimeSchema = (schema: StringSchema): schema is DateOrTimeSchema => hasFormat(schema, 'date-time');

export const isDateSchema = (schema: StringSchema): schema is DateSchema => hasFormat(schema, 'date');

export const isTimeSchema = (schema: StringSchema): schema is TimeSchema => hasFormat(schema, 'time');

const hasFormat = (schema: StringSchema, format?: StringFormat) => {
  if (schema.format != null) {
    return !format ?? schema.format === format;
  }
  return false;
};

export const isDateOrTimeSchema = (schema: StringSchema): schema is DateOrTimeSchema => {
  return schema.format != null && dateOrTimeFormats.indexOf(schema.format) >= 0;
};
