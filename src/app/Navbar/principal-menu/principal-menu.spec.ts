import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalMenu } from './principal-menu';

describe('PrincipalMenu', () => {
  let component: PrincipalMenu;
  let fixture: ComponentFixture<PrincipalMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
