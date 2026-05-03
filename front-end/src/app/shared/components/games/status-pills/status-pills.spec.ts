import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusPills } from './status-pills';

describe('StatusPills', () => {
  let component: StatusPills;
  let fixture: ComponentFixture<StatusPills>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusPills]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusPills);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
