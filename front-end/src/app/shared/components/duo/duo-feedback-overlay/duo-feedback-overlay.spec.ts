import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuoFeedbackOverlay } from './duo-feedback-overlay';

describe('DuoFeedbackOverlay', () => {
  let component: DuoFeedbackOverlay;
  let fixture: ComponentFixture<DuoFeedbackOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuoFeedbackOverlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuoFeedbackOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
