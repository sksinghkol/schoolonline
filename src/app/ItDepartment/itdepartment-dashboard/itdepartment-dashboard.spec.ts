import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdepartmentDashboard } from './itdepartment-dashboard';

describe('ItdepartmentDashboard', () => {
  let component: ItdepartmentDashboard;
  let fixture: ComponentFixture<ItdepartmentDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdepartmentDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItdepartmentDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
