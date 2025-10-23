import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdepartmentLogin } from './itdepartment-login';

describe('ItdepartmentLogin', () => {
  let component: ItdepartmentLogin;
  let fixture: ComponentFixture<ItdepartmentLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdepartmentLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItdepartmentLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
