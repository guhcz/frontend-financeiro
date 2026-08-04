import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge {
  label = input.required<string>();
  color = input<string | null>(null);
  icon = input<string | null>(null);
}
