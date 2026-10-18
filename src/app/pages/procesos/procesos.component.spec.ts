import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Procesos } from './procesos.component';

describe('Procesos', () => {
  let component: Procesos;
  let fixture: ComponentFixture<Procesos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Procesos],
    }).compileComponents();

    fixture = TestBed.createComponent(Procesos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
