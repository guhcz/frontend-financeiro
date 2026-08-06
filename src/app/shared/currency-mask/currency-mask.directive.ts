import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appCurrencyMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true,
    },
  ],
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      this.el.nativeElement.value = '';
      this.onChange(null);
      return;
    }
    const amount = Number(digits) / 100;
    this.el.nativeElement.value = this.format(amount);
    this.onChange(amount);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.el.nativeElement.value = value != null ? this.format(value) : '';
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  private format(amount: number): string {
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
