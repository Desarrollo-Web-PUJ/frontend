import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rechaza textos vacíos o formados solo por espacios. */
export const noVacio: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value;
  return typeof valor === 'string' && valor.trim().length === 0 ? { vacio: true } : null;
};

/** Valida que dos campos del grupo tengan el mismo valor (p. ej. confirmar contraseña). */
export function camposIguales(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value;
    const repetido = grupo.get(confirmacion)?.value;
    return valor && repetido && valor !== repetido ? { noCoinciden: true } : null;
  };
}
