import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../services/api.service';
import { MatDialog } from '@angular/material';
import { UploadModalComponent } from '../upload-modal/upload-modal.component';
import { DeleteImageComponent } from '../delete-image/delete-image.component';
import { Observable } from 'rxjs/Observable';
import { ImageModel } from '../models/image.model';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

  images$: Observable<ImageModel[]>;
  loading$: Observable<boolean>;
  searching$: Observable<boolean>;
  search = '';
  uploading = false;
  uploadFinished = false;
  progress$: Observable<number>;
  uploadCount$: Observable<number>;
  viewing = null;

  @Output('login') login: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('searchBox') searchBox: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(private apiService: ApiService, private dialog: MatDialog) {

  }

  ngOnInit() {
    console.log('Init');
    this.images$ = this.apiService.images$;
    this.loading$ = this.apiService.loading$;
    this.searching$ = this.apiService.searching$;
    
    this.apiService.getImages();
  }
  
  focusSearch() {
    if (!this.search) {
      this.searchBox.nativeElement.focus();
    } else {
      this.searchImages();
    }
  }

  home() {
    this.updateSearch('');
    this.apiService.getImages();
  }

  clearSearch() {
    this.updateSearch('');
  }

  updateSearch(search) {
    this.search = search;
    if (!this.search) {
      this.apiService.clearSearch();
    }
  }

  searchImages() {
    this.apiService.searchImages(this.search);
  }

  uploadPrompt() {
    console.log(this.fileInput.nativeElement);
    this.fileInput.nativeElement.click();
  }

  openUpload() {
    const fileInput: HTMLInputElement = this.fileInput.nativeElement;
    if (fileInput.files.length > 0) {
      const supportedFiles = [];
      for (let i = 0; i < fileInput.files.length; i++) {  
        if (this.supportedMimeType(fileInput.files[i].type)) {
          supportedFiles.push(fileInput.files[i]);
        }
      }
      if (supportedFiles.length > 0) {
        const uploadDialog = this.dialog.open(UploadModalComponent, {
          data: {
            files: fileInput.files
          }
        });
        uploadDialog.beforeClose().subscribe((upload$) => {
          if (upload$) {
            this.uploadFinished = false;
            console.log('Upload ready to begin');
            this.uploading = true;
            upload$.subscribe(() => {
              this.uploadFinished = true;
              setTimeout(() => {
                this.uploading = false;
              }, 1000);
            });
            this.uploadCount$ = this.apiService.progress$.map(values => values.length);
            this.progress$ = this.apiService.progress$.map((values) => {
              return values.reduce((last, current) => last + current) / values.length;
            });
          }
          fileInput.value = null;
        });
      }
    }
  }

  signOut() {
    this.apiService.logOut();
    this.login.emit();
  }

  delete(id: number) {
    const dialog = this.dialog.open(DeleteImageComponent);
    dialog.beforeClose().subscribe(shouldDelete => {
      if (shouldDelete) {
        this.apiService.delete(id).subscribe();
      }
    });
  }

  supportedMimeType(mime) {
    switch(mime) {
      case 'image/png':
      case 'image/jpg':
      case 'image/jpeg':
        return true;
      default:
        return false;
    }
  }

  view(image) {
    this.viewing = image;
  }

  closeView() {
    this.viewing = null;
  }

}
