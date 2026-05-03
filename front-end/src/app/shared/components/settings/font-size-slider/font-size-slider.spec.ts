import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FontSizeSlider } from './font-size-slider';

describe('FontSizeSlider', () => {
  let component: FontSizeSlider;
  let fixture: ComponentFixture<FontSizeSlider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FontSizeSlider]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FontSizeSlider);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
