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
    try {
      const config = JSON.parse(decodedText);
      if (config.restaurantId && config.apiKey) {
        this.settingsService.saveSettings(config.restaurantId, config.apiKey);
        this.router.navigate(['/']);
      } else {
        this.scanError.set('QR Code inválido. Faltam "restaurantId" ou "apiKey".');
      }
    } catch (e) {
      this.scanError.set('Formato de QR Code inválido. Não é um JSON válido.');
    }
  }
}