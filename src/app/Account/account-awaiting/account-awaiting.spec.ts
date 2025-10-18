import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountAwaiting } from './account-awaiting';

describe('AccountAwaiting', () => {
  let component: AccountAwaiting;
  let fixture: ComponentFixture<AccountAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
