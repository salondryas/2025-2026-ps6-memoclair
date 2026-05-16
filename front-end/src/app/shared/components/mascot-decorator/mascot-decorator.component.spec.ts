import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MascotDecoratorComponent } from './mascot-decorator.component';

describe('MascotDecoratorComponent', () => {
  let component: MascotDecoratorComponent;
  let fixture: ComponentFixture<MascotDecoratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MascotDecoratorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MascotDecoratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
