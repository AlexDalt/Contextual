import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ApiService } from '../services/api.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

@Component({
  selector: 'app-upload-modal',
  templateUrl: './upload-modal.component.html',
  styleUrls: ['./upload-modal.component.scss']
})
export class UploadModalComponent implements OnInit {

  images: ImageData[] = [];

  constructor(
    private api: ApiService,
    public dialogRef: MatDialogRef<UploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadPayload
  ) {
    for (let i = 0; i < data.files.length; i++) {

      const imageData = {
        file: data.files[i],
        url: '',
        ready: false
      };
      // this.files.push(data.files[i]);

      const reader: any = new FileReader();
      reader.onload = () => {
          imageData.url = reader.result;
          imageData.ready = true;
      };
      reader.readAsDataURL(imageData.file);
      this.images.push(imageData);
    }
  }

  ngOnInit() {
  }

  upload() {
    console.log('Uploading');
    const files = this.images.map(image => image.file);
    const upload = this.api.upload(files);
    
    this.dialogRef.close(upload);
    // for (let image of this.images) {
    //   uploads.push(this.api.upload(image.file));
    // }
    // Observable.forkJoin(uploads).subscribe((data) => {
    //   console.log('All uploads complete', data);
    // });
  }

}

interface UploadPayload {
  files: File[];
}

interface ImageData {
  file: File;
  url: string;
  ready: boolean;
}