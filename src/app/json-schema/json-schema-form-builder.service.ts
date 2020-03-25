import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { distinctUntilChanged, map, skipWhile, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';

import {
  BooleanSchema,
  ConcreteSchema,
  ConditionalObjectSchema, ConstSchema,
  DateTimeFormat,
  ExplicitObjectSchema,
  MatchSchema,
  NumberSchema,
  NumericSchema,
  ObjectSchema, PrimitiveSchema, Properties,
  Ref,
  SchemaOrRef,
  StringSchema
} from './json-schema';

import { isDateOrTimeSchema, isPatternSchema, isStringSchema } from './util/string';
import { isIntegerSchema, isNumberSchema } from './util/number';
import {
  hasDependencies,
  hasRequirements,
  isConditionalObjectSchema,
  isExplicitObjectSchema,
  isObjectSchema
} from './util/object';
import { isConcreteSchema, isConstSchema, isEnumSchema, isRef } from './util/common';

export type SchemaControlProvider <G extends FormGroup = FormGroup,
  C extends FormControl = FormControl,
  A extends FormArray = FormArray> =
 (schema: ConcreteSchema) => C | G | A | null;



export abstract class JsonSchemaFormBuilder
<G extends FormGroup = FormGroup, C extends FormControl = FormControl, A extends FormArray = FormArray> {
  controlProviders: { [schemaType: string]: SchemaControlProvider<G, C, A> };
  dateTimePatterns: Record<DateTimeFormat, RegExp> = {
    'date-time': /^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\+\d{2}:\d{2}|Z)$/,
    time: /^\d{2}:\d{2}:\d{2}(\+\d{2}:\d{2}|Z)$/,
    date: /^[1-9]\d{3}-\d{2}-\d{2}$/
  };

  arrayControlProvider = (_: ObjectSchema): A => {
    return this.newA();
  }

  abstract newG(): G;
  abstract newC(): C;
  abstract newA(): A;

  stringControlProvider = (schema: StringSchema): C => {
    const formControl = this.newC();
    const validatorFns: ValidatorFn[] = [];

    if (typeof schema.default === 'string') {
      formControl.setValue(schema.default);
    }
    if (isPatternSchema(schema)) {
      validatorFns.push(Validators.pattern(schema.pattern));
    }
    if (isDateOrTimeSchema(schema)) {
      const pattern = this.dateTimePatterns[schema.format];
      if (pattern) {
        validatorFns.push(Validators.pattern(pattern));
      }
    }
    if (isConstSchema(schema)) {
      validatorFns.push(this.constValidator(schema));
    }
    formControl.setValidators(validatorFns);

    return formControl;
  }

  constValidator = (schema: PrimitiveSchema & ConstSchema): ValidatorFn => {
    return (c) => c.value !== schema.const ? {
      const: `Must be ${schema.const}`
    } : null;
  }

  resolveNumericValidatorFns = (schema: NumericSchema): ValidatorFn[] => {
    const validatorFns: ValidatorFn[] = [];

    if (schema.maximum) {
      validatorFns.push(Validators.max(schema.maximum));
    }
    if (schema.minimum) {
      validatorFns.push(Validators.min(schema.minimum));
    }
    if (isNumberSchema(schema)) {
      validatorFns.push(Validators.pattern(/^-?(\d+(\.\d+)?)|(\d*\.\d+)$/));
    } else if (isIntegerSchema(schema)) {
      validatorFns.push(Validators.pattern(/^-?\d+$/));
    }

    return validatorFns;
  }

  numericControlProvider = (schema: NumberSchema): C => {
    const formControl = new FormControl();
    const validatorFns = this.resolveNumericValidatorFns(schema);
    formControl.setValidators(validatorFns);
    return this.newC();
  }

  booleanControlProvider = (_: BooleanSchema): C => {
    return this.newC();
  }

  nullControlProvider = (_: StringSchema): null => {
    return null;
  }

  fromSchema<P extends Properties>(schema: ObjectSchema<P>): G {
    const fg = this.objectControlProvider(schema);
    fg.updateValueAndValidity();
    return fg;
  }

  objectControlProvider = <P extends Properties>(schema: ObjectSchema<P>): G => {
    const formGroup = this.newG();

    if (isExplicitObjectSchema(schema)) {
      Object
        .keys(schema.properties)
        .map((n: keyof P) => [n, this.processSchema(schema.properties[n])])
        .filter(([_, c]) => c != null)
        .forEach(([n, c]: [string, any]) => formGroup.addControl(n, c));

      if (isConditionalObjectSchema(schema)) {
        this.conditionalHandler(formGroup, schema);
      }

      if (hasRequirements(schema)) {
        this.processRequired(formGroup, schema.required);
      }

      if (hasDependencies(schema)) {
        Object.keys(schema.dependencies).forEach((cn) => {
          const dns = (schema.dependencies)[cn];
          if (Array.isArray(dns)) {
            this.processRequired(formGroup, dns);
          }
        });
      }
    }

    return formGroup;
  }

  processRequired = (parent: G, required: string[]) => {
    required
      .map((cn) => parent.get(cn))
      .filter((c) => c != null)
      .forEach((c: AbstractControl) => this.addRequired(c));
  }

  addRequired = (c: AbstractControl) => {
    c.setValidators(Validators.compose([
      c.validator,
      Validators.required,
    ]));
    c.updateValueAndValidity();
  }

  conditionalHandler = (parent: G, schema: ConditionalObjectSchema) => {
    const conditions = this.processAllConditions(parent, schema);

    if (!conditions) {
      return;
    }

    const {
      if: ifProperties,
      then: [thenControls, thenRequired],
      else: [elseControls, elseRequired],
    } = conditions;

    const conditionChanged = this.ifPropertyComparator(ifProperties);

    parent.valueChanges.pipe(
      map(conditionChanged),
      distinctUntilChanged(),
      skipWhile((e) => !e),
      tap((enabled: boolean) => {
        if (enabled) {
          thenRequired.forEach((c) => this.addRequired(c));
          thenControls.forEach((c) => c.enable());
          elseRequired.forEach((c) => c.clearValidators());
          elseControls.forEach((c) => c.disable());
        } else {
          thenRequired.forEach((c) => c.clearValidators());
          thenControls.forEach((c) => c.disable());
          elseRequired.forEach((c) => this.addRequired(c));
          elseControls.forEach((c) => c.enable());
        }
      })
    ).subscribe();
  }

  constructor() {
    this.controlProviders = {
      string: this.stringControlProvider,
      integer: this.numericControlProvider,
      number: this.numericControlProvider,
      object: this.objectControlProvider,
      array: this.arrayControlProvider,
      boolean: this.booleanControlProvider,
      null: this.nullControlProvider,
    };
  }

  processAllConditions = (parent: G, schema: ConditionalObjectSchema): {
    if: { [key: string]: MatchSchema },
    then: [AbstractControl[], AbstractControl[]],
    else: [AbstractControl[], AbstractControl[]],
  } | undefined => {
    if (!isExplicitObjectSchema(schema.if)) {
      return;
    }

    const ip = schema.if.properties;
    const ifPropertyNames = Object.keys(ip);

    for (const ifPropertyName of ifPropertyNames) {
      const ifPropertySchema = schema.if.properties[ifPropertyName];

      if (!parent.get(ifPropertyName)) {
        return;
      }

      if (!isConcreteSchema(ifPropertySchema)) {
        return;
      }
    }

    if (!isExplicitObjectSchema(schema.then)) {
      return;
    }

    const t = this.processConditionControls(parent, schema.then);

    let e: [AbstractControl[], AbstractControl[]] = [[], []];
    if (schema.else && isExplicitObjectSchema(schema.else)) {
      e = this.processConditionControls(parent, schema.else);
    }

    return {
      if: ip,
      then: t,
      else: e
    };
  }

  processConditionControls = (parent: G, schema: ExplicitObjectSchema): [
    AbstractControl[],
    AbstractControl[],
  ] => {
    const conditionalControls: AbstractControl[] = [];
    const existingProperties: { [name: string]: SchemaOrRef } = {};
    Object
      .keys(schema.properties)
      .forEach((cn) => {
        const branchSchema = schema.properties[cn];
        const existingControl = parent.get(cn);
        if (existingControl) {
          existingProperties[cn] = branchSchema;
        } else {
          const newControl = this.processSchema(branchSchema);
          if (newControl) {
            newControl.disable();
            conditionalControls.push(newControl);
            parent.addControl(cn, newControl);
          }
        }
      });

    let conditionallyRequired: AbstractControl[] = [];
    if (hasRequirements(schema)) {
      conditionallyRequired = schema.required
        .map((crn) => parent.get(crn) as AbstractControl)
        .filter((crc) => crc != null);
    }

    return [conditionalControls, conditionallyRequired];
  }

  processSchema = (schema: SchemaOrRef): G | C | A | null | undefined => {
    const provider = this.resolveSchemaProvider(schema);
    if (provider) {
      return provider(schema as ConcreteSchema);
    }
    return;
  }

  private resolveSchemaProvider = (schema: SchemaOrRef): SchemaControlProvider<G, C, A> | undefined => {
    if (!isConcreteSchema(schema)) {
      return;
    } else if (schema.type) {
      return this.controlProviders[schema.type];
    } else if (isObjectSchema(schema)) {
      return this.controlProviders.object;
    } else if (isStringSchema(schema)) {
      return this.controlProviders.string;
    } else {
      return;
    }
  }

  ifPropertyComparator = (ifProperties: { [name: string]: MatchSchema | Ref }) => {
    const ifPropertyNames = Object.keys(ifProperties);

    return (c: { [key: string]: any }): boolean => {
      for (const ipn of ifPropertyNames) {
        const ips = ifProperties[ipn];
        if (isRef(ips)) {
          return false;
        }

        const ipv = c[ipn];
        if (!ipv) {
          return false;
        }

        if (isConstSchema(ips) && ipv !== ips.const) {
          return false;
        } else if (isEnumSchema(ips) && ips.enum.indexOf(ipv) < 0) {
          return false;
        } else if (isStringSchema(ips) && isPatternSchema(ips) && !String(ipv).match(ips.pattern)) {
          return false;
        }
      }
      return true;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class DefaultJsonSchemaFormBuilder extends JsonSchemaFormBuilder {
  newA = () => new FormArray([]);
  newC = () => new FormControl();
  newG = () => new FormGroup({});
}

export class SuperFormGroup extends FormGroup {
  controls: { [key: string] : SuperFormControl | SuperFormGroup };

  get(controlName: string): SuperFormControl {
    return <SuperFormControl> super.get(controlName);
  }

  constructor(controls: { [key: string] : FormControl | FormGroup }) {
    super(controls);

    this.valueChanges.subscribe(() => {
      Object.keys(this.controls).forEach(key => {
        const control = <SuperFormControl> this.controls[key];
        if (!control.enableIf) return;

        const enable = control.enableIf();
        if (enable) {
          this.get(key).enable({ emitEvent: false });
        } else {
          this.get(key).disable({ emitEvent: false });
        }
      });
    });
  }
}

export class SuperFormControl extends FormControl {
  enableIf: () => boolean;
}

declare class SuperFormArray extends FormArray {}

@Injectable({
  providedIn: 'root'
})
export class SuperJsonSchemaFormBuilder extends JsonSchemaFormBuilder<SuperFormGroup, SuperFormControl, SuperFormArray> {
  newA = () => new SuperFormArray([]);
  newC = () => new SuperFormControl();
  newG = () => new SuperFormGroup({});
}
