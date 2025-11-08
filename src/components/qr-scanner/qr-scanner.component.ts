import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div class="w-full max-w-md mx-auto bg-gray-800 rounded-2xl shadow-lg p-6 text-center relative">
        <a routerLink="/" class="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        
        <h1 class="text-2xl font-bold mb-2">Escanear QR Code</h1>
        <p class="text-gray-400 mb-4">Aponte a câmera para o QR code do colaborador.</p>

        @if (error()) {
          <div class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong class="font-bold">Erro: </strong>
            <span class="block sm:inline">{{ error() }}</span>
          </div>
        }

        <div class="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden relative mb-4">
          <video #videoElement class="w-full h-full object-cover" autoplay playsinline></video>
          
          @if (isScanning()) {
            <div class="absolute inset-0 border-4 border-emerald-500 rounded-lg animate-pulse"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4">
              <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
              <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
              <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
              <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
            </div>
          } @else if (!error()) {
             <div class="absolute inset-0 flex items-center justify-center bg-gray-900/70">
                <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="ml-3 text-lg">Iniciando câmera...</span>
             </div>
          }
        </div>
        
        <button (click)="startScan()" [disabled]="isScanning()"
                class="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
          Tentar Novamente
        </button>

      </div>
    </div>
  `,
})
export class QrScannerComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  
  error = signal<string | null>(null);
  isScanning = signal(false);
  
  private stream: MediaStream | null = null;
  private barcodeDetector: any; // Using `any` as BarcodeDetector is not in default TS libs yet

  ngOnInit(): void {
    this.initializeScanner();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }
  
  private initializeScanner(): void {
    // Check for BarcodeDetector API support
    // @ts-ignore
    if ('BarcodeDetector' in window && window.BarcodeDetector) {
      try {
        // @ts-ignore
        this.barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        this.startScan();
      } catch (e) {
        console.error('Error initializing BarcodeDetector:', e);
        this.error.set('Falha ao iniciar o leitor de QR Code. O dispositivo pode não ser compatível.');
      }
    } else {
      this.error.set('Leitor de QR Code não é suportado neste navegador.');
    }
  }

  async startScan(): Promise<void> {
    if (this.isScanning() || !this.barcodeDetector) return;
    this.error.set(null);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      this.videoElement.nativeElement.srcObject = this.stream;
      await this.videoElement.nativeElement.play();
      this.isScanning.set(true);
      requestAnimationFrame(() => this.scanFrame());
    } catch (err) {
      console.error('Error accessing camera', err);
      let message = 'Não foi possível acessar a câmera.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = 'Permissão para acessar a câmera foi negada. Por favor, habilite o acesso nas configurações do seu navegador.';
        } else if (err.name === 'NotFoundError') {
          message = 'Nenhuma câmera foi encontrada no dispositivo.';
        }
      }
      this.error.set(message);
      this.isScanning.set(false);
    }
  }

  private async scanFrame(): Promise<void> {
    if (!this.isScanning() || !this.videoElement?.nativeElement || this.videoElement.nativeElement.readyState < 2) {
      return;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(this.videoElement.nativeElement);
      if (barcodes.length > 0) {
        this.handleQrCode(barcodes[0].rawValue);
      } else if (this.isScanning()) {
        requestAnimationFrame(() => this.scanFrame());
      }
    } catch (err) {
      // Some errors can happen during detection, but we want to keep trying.
      console.warn('QR Scan Frame Error:', err);
      if (this.isScanning()) {
         requestAnimationFrame(() => this.scanFrame());
      }
    }
  }

  private handleQrCode(data: string): void {
    this.stopScan();
    
    // Assumption: The QR code contains the employee ID directly.
    // In a real-world scenario, this might be a URL or a JSON object that needs parsing.
    const employeeId = data.trim();

    if (employeeId) {
        this.router.navigate(['/pin', employeeId]);
    } else {
        this.error.set('QR Code inválido ou vazio.');
        // Allow user to retry
    }
  }

  stopScan(): void {
    this.isScanning.set(false);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }
}
