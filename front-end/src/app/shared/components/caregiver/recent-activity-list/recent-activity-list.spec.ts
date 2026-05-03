import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentActivityList } from './recent-activity-list';

describe('RecentActivityList', () => {
  let component: RecentActivityList;
  let fixture: ComponentFixture<RecentActivityList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentActivityList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentActivityList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
