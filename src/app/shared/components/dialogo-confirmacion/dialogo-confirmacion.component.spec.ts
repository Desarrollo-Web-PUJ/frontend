import { TestBed } from '@angular/core/testing';

import { DialogoConfirmacion } from './dialogo-confirmacion.component';

describe('Diálogo de confirmación', () => {
  it('emite confirmar o cancelar según el botón', () => {
    TestBed.configureTestingModule({ imports: [DialogoConfirmacion] });
    const fixture = TestBed.createComponent(DialogoConfirmacion);
    fixture.componentRef.setInput('mensaje', '¿Eliminar el proceso Compras?');
    fixture.componentRef.setInput('textoConfirmar', 'Eliminar');
    fixture.detectChanges();

    const eventos: string[] = [];
    fixture.componentInstance.confirmar.subscribe(() => eventos.push('confirmar'));
    fixture.componentInstance.cancelar.subscribe(() => eventos.push('cancelar'));

    const [confirmar, cancelar] = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(confirmar.textContent).toContain('Eliminar');
    confirmar.click();
    cancelar.click();
    expect(eventos).toEqual(['confirmar', 'cancelar']);
  });

  it('bloquea los botones mientras se procesa', () => {
    TestBed.configureTestingModule({ imports: [DialogoConfirmacion] });
    const fixture = TestBed.createComponent(DialogoConfirmacion);
    fixture.componentRef.setInput('mensaje', '¿Continuar?');
    fixture.componentRef.setInput('ocupado', true);
    fixture.detectChanges();

    const botones = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect([...botones].every(boton => boton.disabled)).toBe(true);
  });
});
