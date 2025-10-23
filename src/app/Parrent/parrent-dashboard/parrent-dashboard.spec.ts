import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParrentDashboard } from './parrent-dashboard';

describe('ParrentDashboard', () => {
  let component: ParrentDashboard;
  let fixture: ComponentFixture<ParrentDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParrentDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParrentDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
