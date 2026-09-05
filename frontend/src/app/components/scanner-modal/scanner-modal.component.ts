import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-scanner-modal',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './scanner-modal.component.html',
  styleUrl: './scanner-modal.component.css'
})
export class ScannerModalComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() codeScanned = new EventEmitter<string>();

  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];

  statusMessage = "Autorisez l'accès à la caméra pour scanner.";
  hasError = false;
  hasDevices = true;

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.hasDevices = devices.length > 0;
    this.statusMessage = this.hasDevices
      ? 'Visez le code-barres ou le QR code.'
      : "Aucune caméra détectée. Saisissez le code manuellement.";
    this.hasError = !this.hasDevices;
  }

  onScanSuccess(result: string): void {
    this.codeScanned.emit(result);
    this.close();
  }

  onPermissionResponse(granted: boolean): void {
    if (!granted) {
      this.statusMessage = "Impossible d'accéder à la caméra. Vérifiez les autorisations du navigateur ou saisissez le code manuellement.";
      this.hasError = true;
    }
  }

  onScanError(): void {
    this.statusMessage = "Impossible de lire le code. Réessayez ou saisissez-le manuellement.";
    this.hasError = true;
  }

  close(): void {
    this.closed.emit();
  }
}
