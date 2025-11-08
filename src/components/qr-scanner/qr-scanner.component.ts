import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

// Declare Html5Qrcode to avoid TypeScript errors since it's loaded from a script tag.
declare var Html5Qrcode: any;

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink]
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  
  scanError = signal<string | null>(null);
  isScanning = signal(true);
  
  private html5QrCode: any;

  ngAfterViewInit(): void {
    this.html5QrCode = new Html5Qrcode("qr-reader");
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  startScanner(): void {
    this.scanError.set(null);
    this.isScanning.set(true);
    
    Html5Qrcode.getCameras().then((devices: any[]) => {
      let cameraId;
      if (devices && devices.length) {
        const backCamera = devices.find(device => device.label.toLowerCase().includes('back'));
        cameraId = backCamera ? backCamera.id : devices[0].id;
      }

      this.html5QrCode.start(
        cameraId || { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string, decodedResult: any) => this.onScanSuccess(decodedText),
        (errorMessage: string) => { /* onScanFailure, ignore */ }
      ).catch((err: any) => {
        this.scanError.set('Não foi possível iniciar a câmera. Verifique as permissões.');
        this.isScanning.set(false);
      });
    }).catch((err: any) => {
       this.scanError.set('Não foi possível encontrar câmeras no dispositivo.');
       this.isScanning.set(false);
    });
  }
  
  private stopScanner(): void {
    if (this.html5QrCode && this.isScanning()) {
      this.html5QrCode.stop().then(() => {
        this.isScanning.set(false);
      }).catch((err: any) => {
        console.error("Failed to stop QR scanner.", err);
      });
    }
  }

  private onScanSuccess(decodedText: string): void {
    this.stopScanner();
    let success = false;

    // Attempt 1: Parse as JSON object for backward compatibility
    try {
      const config = JSON.parse(decodedText);
      if (config.restaurantId && config.apiKey) {
        this.settingsService.saveSettings(config.restaurantId, config.apiKey);
        this.router.navigate(['/']);
        success = true;
      }
    } catch (e) {
      // Not a JSON object, proceed to next attempt
    }

    if (success) return;

    // Attempt 2: Parse as semicolon-separated string (restaurantId;apiKey)
    const parts = decodedText.split(';');
    if (parts.length === 2 && parts[0] && parts[1]) {
      const restaurantId = parts[0];
      const apiKey = parts[1];
      this.settingsService.saveSettings(restaurantId, apiKey);
      this.router.navigate(['/']);
      success = true;
    }
    
    if (success) return;

    // If all attempts fail
    this.scanError.set('Formato de QR Code inválido. Verifique o código e tente novamente.');
  }
}