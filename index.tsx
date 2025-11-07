
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';

registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(APP_ROUTES, withHashLocation()),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.