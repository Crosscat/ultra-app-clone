import { ConcreteSchema, IntegerSchema, NumberSchema, NumericSchema } from '../json-schema';

export const isNumericSchema = (schema: ConcreteSchema): schema is NumericSchema => {
  return schema.type != null && ['integer', 'number'].indexOf(schema.type) >= 0;
};

export const isIntegerSchema = (schema: NumericSchema): schema is IntegerSchema => schema.type === 'integer';

export const isNumberSchema = (schema: NumericSchema): schema is NumberSchema => schema.type === 'number';
