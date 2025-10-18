import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountLogin } from './account-login';

describe('AccountLogin', () => {
  let component: AccountLogin;
  let fixture: ComponentFixture<AccountLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
