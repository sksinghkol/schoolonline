import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalDashboard } from './principal-dashboard';

describe('PrincipalDashboard', () => {
  let component: PrincipalDashboard;
  let fixture: ComponentFixture<PrincipalDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
