import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalAwating } from './principal-awating';

describe('PrincipalAwating', () => {
  let component: PrincipalAwating;
  let fixture: ComponentFixture<PrincipalAwating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalAwating]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalAwating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
