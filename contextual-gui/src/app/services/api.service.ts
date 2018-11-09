import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/combineLatest';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/share';
import { ImageModel } from '../models/image.model';

@Injectable()
export class ApiService {
    
    host: string = "https://contextual-186413.appspot.com";
    // host: string = "http://localhost:3000";

    uploading = false;

    authToken = '';

    progress$: Observable<number[]>;

    rawImages$ = new BehaviorSubject<ImageModel[]>([]);
    imagesLoading$ = new BehaviorSubject<boolean>(true);

    searching$ = new BehaviorSubject<boolean>(false);
    searchResults$ = new BehaviorSubject<ImageModel[]>([]);
    searchingLoading$ = new BehaviorSubject<boolean>(false);

    images$: Observable<ImageModel[]>;
    loading$: Observable<boolean>;

    constructor(private http: HttpClient) {
        this.authToken = localStorage.getItem('authToken');
        this.images$ = Observable
            .combineLatest([this.rawImages$, this.searchResults$, this.searching$])
            .map(([raw, results, searching]) => {
                return (searching ? results : raw);
            });
        this.loading$ = Observable.combineLatest([this.imagesLoading$, this.searchingLoading$, this.searching$])
            .map(([images, search, searching]) => {
                return (searching ? search : images);
            });
    }

    config() {
        return {
            headers: this.headers()
        };
    }

    headers() {
        const headers = new HttpHeaders({
            'Authorization': 'JWT ' + this.authToken
        });
        return headers;
    }

    getImages() {
        this.imagesLoading$.next(true);
        this.http.get<ImageModel[]>(this.host + '/images', this.config()).subscribe((data) => {
            this.rawImages$.next(data);
            this.imagesLoading$.next(false);
            console.log('Done');
        });
    }

    searchImages(search: string) {
        search = search.trim();
        if (!search) {
            this.getImages();
        }
        this.searching$.next(true);
        this.searchingLoading$.next(true);
        this.http.get<ImageModel[]>(this.host + '/images/search/' + encodeURIComponent(search), this.config()).subscribe((data) => {
            this.searchResults$.next(data);
            this.searchingLoading$.next(false);
        });
    }

    clearSearch() {
        this.searching$.next(false);
    }

    logIn(email: string, password: string) {
        return this.http.post<any>(this.host + '/auth', {
            email,
            password
        }).do(data => {
            this.setAuthToken(data.token);
        }).map(data => data.success).toPromise<boolean>();
    }

    logOut() {
        localStorage.removeItem('authToken');
        this.rawImages$.next([]);
        this.searchResults$.next([]);
        this.searchingLoading$.next(false);
    }

    createAccount(name: string, email: string, password: string) {
        return this.http.post<any>(this.host + '/auth/create', {
            name,
            email,
            password
        }).do(data => {
            this.setAuthToken(data.token);
        }).map(data => data.success).toPromise<boolean>();
    }

    upload(files: File[]) {
        if (this.uploading) {
            return false;
        }
        this.uploading = true;

        const uploads: Observable<any>[] = [];
        const progress = [];

        for (let file of files) {
            const form = new FormData();
            form.append('image', file);

            const post = new HttpRequest("POST", this.host + '/upload', form, {
                reportProgress: true,
                headers: this.headers()
            });
            // uploads.push(this.http.post<any>(this.host + '/upload', form));
            const request = this.http.request<any>(post).share();
            uploads.push(request.filter(event => event instanceof HttpResponse));
            progress.push(request.filter(event => event.type === HttpEventType.UploadProgress).map((event: any) => {
                return Math.floor(100 * event.loaded / event.total);
            }).startWith(0));
        }

        this.progress$ = Observable.combineLatest(progress);
        
        return Observable.forkJoin(uploads).do((data) => {
            console.log(data);
            const images = this.rawImages$.getValue();
            for (let item of data) {
                images.unshift(item.body);
            }
            this.rawImages$.next(images);
            this.uploading = false
        });
        
        // .subscribe((data) => {
        //     console.log('All uploads complete', data);
        // });
    }

    delete(id: number) {
        return this.http.delete(this.host + '/images/' + id, this.config()).do(() => {
            let images = this.rawImages$.getValue();
            images = images.filter(item => item.id !== id);
            this.rawImages$.next(images);

            let results = this.searchResults$.getValue();
            results = results.filter(item => item.id !== id);
            this.searchResults$.next(images);
        });
    }

    private setAuthToken(token: string) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
    }

}