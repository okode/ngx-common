import { Injectable, Inject, InjectionToken, Optional } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export const HTTP_CACHE_INTERCEPTOR_DURATION_MINS = new InjectionToken<number>('httpCache.mins');

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {

  private static readonly HEADER_NAME = 'X-NGX-CACHE-INTERCEPTOR';
  private static readonly HEADER_VALUE_CACHE_RESPONSE = 'cache-response';
  private static readonly HEADER_VALUE_CACHE_CLEAR = 'clear-cache';

  private cache = new Map<string, { response: HttpResponse<any>, timestamp: number }>();
  private durationMins = null;

  constructor(@Optional() @Inject(HTTP_CACHE_INTERCEPTOR_DURATION_MINS) duration: number) {
    this.durationMins = duration || null;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headerValue = req.headers.get(HttpCacheInterceptor.HEADER_NAME);
    req = req.clone({ headers: req.headers.delete(HttpCacheInterceptor.HEADER_NAME) });

    if (!headerValue) {
      return next.handle(req);
    }

    if (headerValue === HttpCacheInterceptor.HEADER_VALUE_CACHE_CLEAR) {
      console.log(`HttpCacheInterceptor: Cleaning cache, ${this.cache.size} responses stored`);
      this.cache.clear();
      console.log(`HttpCacheInterceptor: Cache has been cleaned`);
      return next.handle(req);
    }

    if (req.method !== 'GET') {
      return next.handle(req);
    }

    console.log(`HttpCacheInterceptor: Processing request [GET]: ${req.urlWithParams}`);

    const cachedResponse = this.cache.get(req.urlWithParams);
    if (cachedResponse && !this.isReponseExpired(cachedResponse)) {
      console.log(`HttpCacheInterceptor: Return response from session cache`);
      return of(cachedResponse.response);
    }

    const cacheResponse = (headerValue === HttpCacheInterceptor.HEADER_VALUE_CACHE_RESPONSE);

    return next.handle(req).pipe(tap(event => {
      if (event instanceof HttpResponse && cacheResponse) {
        this.cache.set(req.urlWithParams, { response: event.clone(), timestamp: Date.now() });
        console.log(`HttpCacheInterceptor: Stored response in cache`);
      }
    }));
  }

  private isReponseExpired(cachedResponse: any) {
    if (!this.durationMins) { return false; }
    return Date.now() > cachedResponse.timestamp + (this.durationMins * 60000);
  }

}
