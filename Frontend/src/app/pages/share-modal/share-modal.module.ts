import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ShareModalPage } from './share-modal.page';
import { RecipePreviewModule } from '@/components/recipe-preview/recipe-preview.module';
import {GlobalModule} from '@/global.module';
import {CopyWithWebshareModule} from '@/components/copy-with-webshare/copy-with-webshare.module';

@NgModule({
  declarations: [
    ShareModalPage,
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    RecipePreviewModule,
    GlobalModule,
    CopyWithWebshareModule,
  ],
  entryComponents: [
    ShareModalPage,
  ],
})
export class ShareModalPageModule {}
