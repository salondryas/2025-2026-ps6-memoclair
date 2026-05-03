import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSelector } from './patient-selector';

describe('PatientSelector', () => {
  let component: PatientSelector;
  let fixture: ComponentFixture<PatientSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
