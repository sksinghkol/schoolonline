import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalProfile } from './principal-profile';

describe('PrincipalProfile', () => {
  let component: PrincipalProfile;
  let fixture: ComponentFixture<PrincipalProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
