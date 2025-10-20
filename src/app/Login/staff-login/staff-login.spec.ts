import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffLogin } from './staff-login';

describe('StaffLogin', () => {
  let component: StaffLogin;
  let fixture: ComponentFixture<StaffLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
