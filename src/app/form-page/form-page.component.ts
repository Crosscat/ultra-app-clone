import { Component } from '@angular/core';
import { SuperJsonSchemaFormBuilder, SuperFormGroup, SuperFormControl } from '../json-schema/json-schema-form-builder.service';
import { ObjectSchema } from '../json-schema/json-schema';
import { from } from 'rxjs';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-page',
  templateUrl: './form-page.component.html',
  styleUrls: ['./form-page.component.scss']
})
export class FormPageComponent {
  loaded: boolean;
  form: SuperFormGroup;

  constructor(jsonSchemaFormBuilder: SuperJsonSchemaFormBuilder) {
    from(
      import('../json-schema/x.schema.json')
        .then((s) => jsonSchemaFormBuilder.fromSchema(s as ObjectSchema))
    ).subscribe((f) => {
        this.form = f;
        this.loaded = true;

        this.setDependencies();
    });

  }

  private setDependencies() {
    this.form.get('y').enableIf = () => this.form.value.x === 'x';
    this.form.get('z').enableIf = () => this.form.value.y === 'y';
  }

  onSubmit() {
    console.log(this.form.value);
  }
}
