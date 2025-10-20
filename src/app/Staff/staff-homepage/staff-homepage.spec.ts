import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffHomepage } from './staff-homepage';

describe('StaffHomepage', () => {
  let component: StaffHomepage;
  let fixture: ComponentFixture<StaffHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
