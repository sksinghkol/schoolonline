import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurFacility } from './our-facility';

describe('OurFacility', () => {
  let component: OurFacility;
  let fixture: ComponentFixture<OurFacility>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurFacility]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurFacility);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
