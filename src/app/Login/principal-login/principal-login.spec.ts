import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalLogin } from './principal-login';

describe('PrincipalLogin', () => {
  let component: PrincipalLogin;
  let fixture: ComponentFixture<PrincipalLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
