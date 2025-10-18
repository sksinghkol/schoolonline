import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountHomepage } from './account-homepage';

describe('AccountHomepage', () => {
  let component: AccountHomepage;
  let fixture: ComponentFixture<AccountHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
