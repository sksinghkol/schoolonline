import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityLogin } from './security-login';

describe('SecurityLogin', () => {
  let component: SecurityLogin;
  let fixture: ComponentFixture<SecurityLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
