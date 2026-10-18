
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  LoginRequest,
  LoginResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly url = '/api/auth';

  login(datos: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.url}/login`,
      datos,
      { withCredentials: true }
    );
  }

  logout(): Observable<string> {
    return this.http.post(
      `${this.url}/logout`,
      {},
      {
        withCredentials: true,
        responseType: 'text'
      }
    );
  }
}



