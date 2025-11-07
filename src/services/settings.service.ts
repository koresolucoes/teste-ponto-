import { computed, Injectable, signal } from '@angular/core';

const RESTAURANT_ID_KEY = 'gastronomico_restaurant_id';
const API_KEY_KEY = 'gastronomico_api_key';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  restaurantId = signal<string | null>(localStorage.getItem(RESTAURANT_ID_KEY));
  apiKey = signal<string | null>(localStorage.getItem(API_KEY_KEY));

  isConfigured = computed(() => !!this.restaurantId() && !!this.apiKey());

  saveSettings(restaurantId: string, apiKey: string): void {
    localStorage.setItem(RESTAURANT_ID_KEY, restaurantId);
    localStorage.setItem(API_KEY_KEY, apiKey);
    this.restaurantId.set(restaurantId);
    this.apiKey.set(apiKey);
  }
}
