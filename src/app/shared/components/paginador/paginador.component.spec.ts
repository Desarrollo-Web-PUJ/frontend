import { TestBed } from '@angular/core/testing';

import { Paginador } from './paginador.component';

describe('Paginador', () => {
  function crear(pagina: number, totalPaginas: number) {
    TestBed.configureTestingModule({ imports: [Paginador] });
    const fixture = TestBed.createComponent(Paginador);
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('totalPaginas', totalPaginas);
    fixture.detectChanges();
    const emitidas: number[] = [];
    fixture.componentInstance.cambiar.subscribe(valor => emitidas.push(valor));
    const [anterior, siguiente] = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    return { fixture, emitidas, anterior, siguiente };
  }

  it('muestra la página en base 1 y emite la página solicitada', () => {
    const { fixture, emitidas, anterior, siguiente } = crear(1, 3);
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 3');
    siguiente.click();
    anterior.click();
    expect(emitidas).toEqual([2, 0]);
  });

  it('deshabilita los extremos', () => {
    const { anterior, siguiente } = crear(0, 1);
    expect(anterior.disabled).toBe(true);
    expect(siguiente.disabled).toBe(true);
  });
});
