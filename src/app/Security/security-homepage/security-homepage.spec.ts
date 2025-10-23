import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityHomepage } from './security-homepage';

describe('SecurityHomepage', () => {
  let component: SecurityHomepage;
  let fixture: ComponentFixture<SecurityHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
