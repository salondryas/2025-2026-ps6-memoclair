import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientProfileCard } from './patient-profile-card';

describe('PatientProfileCard', () => {
  let component: PatientProfileCard;
  let fixture: ComponentFixture<PatientProfileCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientProfileCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientProfileCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
