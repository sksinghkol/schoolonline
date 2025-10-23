import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdepartmentAwaiting } from './itdepartment-awaiting';

describe('ItdepartmentAwaiting', () => {
  let component: ItdepartmentAwaiting;
  let fixture: ComponentFixture<ItdepartmentAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdepartmentAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItdepartmentAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
