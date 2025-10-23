import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamcontrollerDashboard } from './examcontroller-dashboard';

describe('ExamcontrollerDashboard', () => {
  let component: ExamcontrollerDashboard;
  let fixture: ComponentFixture<ExamcontrollerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamcontrollerDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamcontrollerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
