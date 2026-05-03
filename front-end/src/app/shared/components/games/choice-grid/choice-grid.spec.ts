import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoiceGrid } from './choice-grid';

describe('ChoiceGrid', () => {
  let component: ChoiceGrid;
  let fixture: ComponentFixture<ChoiceGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoiceGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoiceGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
