import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  settingsForm = this.fb.group({
    restaurantId: ['', [Validators.required]],
    apiKey: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.settingsForm.patchValue({
      restaurantId: this.settingsService.restaurantId() || '',
      apiKey: this.settingsService.apiKey() || '',
    });
  }

  save(): void {
    if (this.settingsForm.valid) {
      const { restaurantId, apiKey } = this.settingsForm.getRawValue();
      this.settingsService.saveSettings(restaurantId!, apiKey!);
      this.router.navigate(['/']);
    }
  }
}
