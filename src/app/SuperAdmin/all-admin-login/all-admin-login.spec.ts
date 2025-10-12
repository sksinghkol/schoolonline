import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAdminLogin } from './all-admin-login';

describe('AllAdminLogin', () => {
  let component: AllAdminLogin;
  let fixture: ComponentFixture<AllAdminLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAdminLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllAdminLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
