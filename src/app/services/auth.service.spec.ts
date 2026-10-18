
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  correo: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly url = '/api/auth';

  login(datos: LoginRequest): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.url}/login`,
      datos,
      { withCredentials: true }
    );
  }
}
