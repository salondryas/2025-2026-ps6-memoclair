import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HintBannerComponent } from './hint-banner.component';

describe('HintBannerComponent', () => {
  let component: HintBannerComponent;
  let fixture: ComponentFixture<HintBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HintBannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HintBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
