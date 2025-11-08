import { Injectable } from '@angular/core';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  getCurrentPositionAsPromise(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocalização não é suportada por este navegador.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada pelo usuário.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informação de localização está indisponível.';
              break;
            case error.TIMEOUT:
              errorMessage = 'A requisição para obter a localização expirou.';
              break;
            default:
              errorMessage = 'Ocorreu um erro desconhecido.';
              break;
          }
          reject(new Error(errorMessage));
        },
        // Opções para maior precisão e para evitar posições em cache.
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } 
      );
    });
  }
}
