import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrincipalHomepage } from './principal-homepage';

describe('PrincipalHomepage', () => {
  let component: PrincipalHomepage;
  let fixture: ComponentFixture<PrincipalHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrincipalHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrincipalHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
