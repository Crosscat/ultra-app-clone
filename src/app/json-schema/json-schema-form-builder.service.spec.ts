import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { DefaultJsonSchemaFormBuilder, JsonSchemaFormBuilder } from './json-schema-form-builder.service';

describe('JsonSchemaFormService', () => {
  let service: JsonSchemaFormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule]
    });
    service = TestBed.inject(DefaultJsonSchemaFormBuilder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create controls from properties', () => {
    const form = service.objectControlProvider({
      properties: {
        x: {
          type: 'string',
        },
        y: {
          default: ''
        },
      }
    });
    expect(form.value).toEqual({
      x: null,
      y: '',
    });
    expect(form.valid).toBeTrue();
  });

  it('should support required properties', () => {
    const form = service.objectControlProvider({
      properties: {
        x: {
          type: 'string',
        },
        y: {
          default: 'something'
        },
        z: {
          type: 'string'
        }
      },
      required: ['x', 'y']
    });
    expect(form.value).toEqual({
      x: null,
      y: 'something',
      z: null
    });
    expect(form.valid).toBeFalse();
    form.get('x')?.setValue('test');
    expect(form.value).toEqual({
      x: 'test',
      y: 'something',
      z: null
    });
    expect(form.valid).toBeTrue();
  });

  it('should support string patterns', () => {
    const form = service.objectControlProvider({
      properties: {
        test: {
          pattern: '^test\\s+\\d{2,4}$'
        }
      }
    });
    expect(form.valid).toBeTrue();

    const testControl = form.get('test') as FormControl;
    expect(testControl.valid).toBeTrue();

    testControl.setValue('abc');
    expect(testControl.valid).toBeFalse();
    expect(testControl.hasError('pattern')).toBeTrue();
    expect(form.valid).toBeFalse();

    testControl.setValue('test\t123');
    expect(testControl.valid).toBeTrue();
    expect(testControl.errors).toBeNull();
    expect(form.valid).toBeTrue();
  });

  it('should support dates', () => {
    const form = service.objectControlProvider({
      properties: {
        test: {
          format: 'date-time'
        },
        testTime: {
          format: 'time'
        },
        testDate: {
          format: 'date'
        }
      }
    });
    expect(form.valid).toBeTrue();
    form.get('test')?.setValue('2020/02/04-11:10PM');
    expect(form.valid).toBeFalse();
    form.get('test')?.setValue('2020-02-04T11:10:23Z');
    expect(form.valid).toBeTrue();
    form.get('test')?.setValue('2020-02-04T11:10:23+05:00');
    expect(form.valid).toBeTrue();
    form.get('testTime')?.setValue('11:10:23Z');
    expect(form.valid).toBeTrue();
    form.get('testDate')?.setValue('2020-02-04');
    expect(form.valid).toBeTrue();
  });

  it('should support dependencies', () => {
    const form = service.objectControlProvider({
      properties: {
        x: { type: 'string' },
        y: { type: 'string' },
        z: { type: 'string' }
      },
      dependencies: {
        y: ['z']
      }
    });
    expect(form.value).toEqual({
      x: null, y: null, z: null
    });
    expect(form.valid).toBeFalse();
    form.get('z')?.setValue('fixed');
    expect(form.valid).toBeTrue();
  });

  it('should support conditionals', () => {
    const form = service.objectControlProvider({
      properties: {
        x: { type: 'string' },
        y: { type: 'string' },
      },
      if: {
        properties: {
          x: {
            const: 'xc',
          }
        }
      },
      then: {
        properties: {
          z: {
            type: 'string',
          }
        },
        required: ['z']
      },
      else: {
        if: {
          properties: {
            x: {
              const: 'wc'
            }
          }
        },
        then: {
          properties: {
            w: {
              type: 'string'
            }
          },
          required: ['y']
        }
      }
    });
    expect(form.value).toEqual({
      x: null,
      y: null,
    });
    expect(form.get('z')?.disabled).toBeTrue();
    form.get('x')?.setValue('xc');
    expect(form.get('z')?.enabled).toBeTrue();
    expect(form.value).toEqual({
      x: 'xc',
      y: null,
      z: null,
    });
    expect(form.valid).toBeFalse();
    form.get('z')?.setValue('req now');
    expect(form.valid).toBeTrue();
    form.get('x')?.setValue('x');
    expect(form.value).toEqual({
      x: 'x',
      y: null,
    });
    expect(form.valid).toBeTrue();
    form.get('x')?.setValue('wc');
    expect(form.value).toEqual({
      x: 'wc',
      y: null,
      // w: null,
    });
    // expect(form.valid).toBeFalse();
  });
});
