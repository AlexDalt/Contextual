import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { MatToolbarModule, MatCardModule, MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatDialogModule, MatProgressBarModule } from '@angular/material';


import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';
import { FormsModule } from '@angular/forms';
import { GalleryComponent } from './gallery/gallery.component';
import { LoginComponent } from './login/login.component';
import { UploadModalComponent } from './upload-modal/upload-modal.component';
import { DeleteImageComponent } from './delete-image/delete-image.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent,
    GalleryComponent,
    LoginComponent,
    UploadModalComponent,
    DeleteImageComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatProgressBarModule
  ],
  providers: [
    ApiService
  ],
  entryComponents: [
    AppComponent,
    UploadModalComponent,
    DeleteImageComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
