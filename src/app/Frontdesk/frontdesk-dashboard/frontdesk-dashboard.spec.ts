import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskDashboard } from './frontdesk-dashboard';

describe('FrontdeskDashboard', () => {
  let component: FrontdeskDashboard;
  let fixture: ComponentFixture<FrontdeskDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
