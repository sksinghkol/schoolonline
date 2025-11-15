import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurVision } from './our-vision';

describe('OurVision', () => {
  let component: OurVision;
  let fixture: ComponentFixture<OurVision>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurVision]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurVision);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
