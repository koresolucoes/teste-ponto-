import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  AfterViewInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

// Declare the library loaded from the script tag in index.html
declare var Html5Qrcode: any;

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  scanError = signal<string | null>(null);
  isScanning = signal(false);

  private html5QrCode: any;
  private isStopping = false;

  ngAfterViewInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  startScanner(): void {
    if (this.isScanning() || this.isStopping) return;

    this.scanError.set(null);
    this.isStopping = false;

    try {
      this.html5QrCode = new Html5Qrcode('qr-reader');
      this.isScanning.set(true);

      const config = { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [] };

      this.html5QrCode
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText: string) => this.onScanSuccess(decodedText),
          (errorMessage: string) => this.onScanFailure(errorMessage)
        )
        .catch((err: any) => {
          this.scanError.set('Falha ao iniciar a câmera. Verifique as permissões.');
          console.error(err);
          this.isScanning.set(false);
        });
    } catch (e) {
      this.scanError.set('Não foi possível carregar a biblioteca do leitor de QR code.');
      console.error(e);
      this.isScanning.set(false);
    }
  }

  private stopScanner(): void {
    if (this.isStopping || !this.html5QrCode) {
      return;
    }
    
    // Only try to stop if the scanner is actually running
    if (this.isScanning()) {
        this.isStopping = true;
        this.isScanning.set(false);
        
        this.html5QrCode.stop()
          .then(() => {
            this.html5QrCode.clear();
          })
          .catch((err: any) => {
            // It's safe to ignore the "not running" error, as it can happen
            // during rapid navigation or component destruction.
            if (!err?.message?.includes('not running')) {
              console.error('Failed to stop the scanner gracefully.', err);
            }
          })
          .finally(() => {
             this.isStopping = false;
          });
    }
  }

  private onScanSuccess(decodedText: string): void {
    if (this.isStopping) return;

    // Stop the scanner immediately on success
    this.stopScanner();

    try {
      let config: { restaurantId?: string; apiKey?: string } | null = null;

      // Try parsing as JSON first
      if (decodedText.trim().startsWith('{')) {
        const parsedJson = JSON.parse(decodedText);
        if (parsedJson.restaurantId && parsedJson.apiKey) {
          config = {
            restaurantId: parsedJson.restaurantId,
            apiKey: parsedJson.apiKey,
          };
        }
      } else {
        // Fallback to string split for "id;key" format
        const parts = decodedText.split(';');
        if (parts.length === 2 && parts[0] && parts[1]) {
          config = {
            restaurantId: parts[0],
            apiKey: parts[1],
          };
        }
      }

      if (config?.restaurantId && config?.apiKey) {
        this.settingsService.saveSettings(config.restaurantId, config.apiKey);
        this.router.navigate(['/']);
      } else {
        this.scanError.set('Formato do QR Code inválido. Não foi possível encontrar as credenciais.');
      }
    } catch (e) {
      console.error('Error parsing QR Code', e);
      this.scanError.set('QR Code inválido. O conteúdo não é um JSON ou texto válido.');
    }
  }

  private onScanFailure(error: string): void {
    // The library calls this frequently, so we only log significant errors.
    // "No QR code found" is expected and should be ignored.
    if (!error?.includes('No QR code found')) {
      console.warn(`QR Code scan failure: ${error}`);
    }
  }
}
