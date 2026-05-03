import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuoToggle } from './duo-toggle';

describe('DuoToggle', () => {
  let component: DuoToggle;
  let fixture: ComponentFixture<DuoToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuoToggle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuoToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
