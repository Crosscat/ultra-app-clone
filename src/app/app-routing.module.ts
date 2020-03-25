import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormPageComponent } from './form-page/form-page.component';


const routes: Routes = [
  {
    path: 'form',
    component: FormPageComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/form'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
