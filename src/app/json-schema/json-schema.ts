
export type NumericSchemaType = 'integer' | 'number';

export type SchemaType = 'string' | NumericSchemaType | 'object' | 'array' | 'boolean' | 'null';

export interface Schema {
  $schema?: string;
  title?: string;
  $id?: string;
  description?: string;
  default?: any;
  examples?: any[];
  $comment?: string;
  enum?: any[];
  const?: any;
  contentMediaType?: string;
  contentEncoding?: string;
  anyOf?: SchemaOrRef[];
  allOf?: SchemaOrRef[];
  oneOf?: SchemaOrRef[];
  not?: SchemaOrRef;
  if?: Pick<MatchObjectSchema, 'properties'>;
  then?: SchemaOrRef;
  else?: SchemaOrRef;
  type?: SchemaType | SchemaType[];
}

export interface Ref {
  $ref: string;
}

export type PrimitiveSchema = StringSchema | BaseNumericSchema | BooleanSchema | NullSchema;

export type ConcreteSchema = PrimitiveSchema | BaseObjectSchema | ArraySchema;

export type ConstSchema = PrimitiveSchema & Required<Pick<PrimitiveSchema, 'const'>>;

export type EnumSchema = PrimitiveSchema & Required<Pick<PrimitiveSchema, 'enum'>>;

export type ExactSchema = ConstSchema | EnumSchema;

export interface TimeSchema extends FormatSchema {
  format: 'time';
}

export interface DateTimeSchema extends FormatSchema {
  format: 'date-time';
}

export interface DateSchema extends FormatSchema {
  format: 'date';
}

export type DateOrTimeSchema = DateTimeSchema | TimeSchema | DateSchema;

export type MatchPrimitiveSchema = ExactSchema | PatternSchema;

export type SchemaOrRef = Schema | ConcreteSchema | Ref;

export type DateTimeFormat = 'date-time' | 'time' | 'date';

export type EmailAddressFormat = 'email' | 'idn-email';

export type HostnameFormat = 'hostname' | 'idn-hostname';

export type IpAddressFormat = 'ipv4' | 'ipv6';

export type ResourceIdentifierFormat = 'uri' | 'uri-reference' | 'iri' | 'iri-reference';

export type UriTemplateFormat = 'uri-template';

export type JsonPointerFormat = 'json-pointer' | 'relative-json-pointer';

export type RegexFormat = 'regex';

export type StringFormat = DateTimeFormat
  | EmailAddressFormat
  | HostnameFormat | IpAddressFormat
  | ResourceIdentifierFormat
  | UriTemplateFormat
  | JsonPointerFormat
  | RegexFormat;

interface BaseStringSchema extends Schema {
  type?: 'string';
  minLength?: number;
  maxLength?: number;
  format?: StringFormat;
  pattern?: string;
}

export interface SimpleStringSchema extends BaseStringSchema {
  type: 'string';
}

export interface PatternSchema extends BaseStringSchema, Partial<FormatSchema> {
  pattern: string;
}

export interface FormatSchema extends BaseStringSchema, Partial<PatternSchema> {
  format: StringFormat;
}

export type StringSchema = SimpleStringSchema | Partial<PatternSchema> | Partial<FormatSchema>;

interface BaseNumericSchema extends Schema {
  type: NumericSchemaType;
  multipleOf?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
}

export interface IntegerSchema extends BaseNumericSchema {
  type: 'integer';
}


export interface NumberSchema extends BaseNumericSchema {
  type: 'number';
}

export type NumericSchema = IntegerSchema | NumberSchema;

export interface Properties {
  [name: string]: SchemaOrRef;
}

interface BaseObjectSchema<P extends Properties = Properties> extends Schema {
  type?: 'object';
  properties?: P;
  additionalProperties?: boolean | SchemaOrRef;
  required?: Array<keyof P & string>;
  propertyNames?: StringSchema | Ref;
  minProperties?: number;
  maxProperties?: number;
  dependencies?: {
    [name: string]: string[] | BaseObjectSchema | Ref;
  };
  patternProperties?: {
    [pattern: string]: SchemaOrRef;
  };
}

export type ExplicitObjectSchema<P extends Properties = Properties> = RequiredPick<BaseObjectSchema<P>, 'properties'>;

export type ConditionalObjectSchema<P extends Properties = Properties> = RequiredPick<BaseObjectSchema<P>, 'if' | 'then'>;

export type ObjectSchema<P extends Properties = Properties> = ExplicitObjectSchema<P> | ConditionalObjectSchema<P>;

export type ObjectSchemaWithRequirements = RequiredPick<ExplicitObjectSchema, 'required'>;

export type ObjectSchemaWithDependencies = RequiredPick<ExplicitObjectSchema, 'dependencies'>;

export type AllOfSchema = RequiredPick<Schema, 'allOf'>;

export type AnyOfSchema = RequiredPick<Schema, 'anyOf'>;

export type OneOfSchema = RequiredPick<Schema, 'oneOf'>;

export type RequiredPick<T, K extends keyof T> = T & Required<Pick<T, K>>;


export interface MatchArraySchema extends ArraySchema {
  items?: MatchSchema | MatchSchema[];
  contains?: MatchSchema;
  additionalItems?: boolean | MatchSchema;
}

export type MatchSchema = MatchObjectSchema | MatchPrimitiveSchema | MatchArraySchema;

export interface MatchObjectSchema extends BaseObjectSchema {
  properties?: {
    [name: string]: MatchSchema,
  };
  patternProperties?: {
    [pattern: string]: MatchSchema,
  };
  additionalProperties?: boolean | MatchSchema;
}
export type NotSchemaSchema = Schema & Required<Pick<Schema, 'not'>>;

export interface ArraySchema extends Schema {
  type: 'array';
  items?: SchemaOrRef | SchemaOrRef[];
  contains?: SchemaOrRef;
  additionalItems?: boolean | SchemaOrRef;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: number;
}

export interface BooleanSchema extends Schema {
  type: 'boolean';
}

export interface NullSchema extends Schema {
  type: 'null';
}
