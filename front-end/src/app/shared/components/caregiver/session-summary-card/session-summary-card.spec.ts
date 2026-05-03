import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionSummaryCard } from './session-summary-card';

describe('SessionSummaryCard', () => {
  let component: SessionSummaryCard;
  let fixture: ComponentFixture<SessionSummaryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionSummaryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionSummaryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
