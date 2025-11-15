import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurCrriculam } from './our-crriculam';

describe('OurCrriculam', () => {
  let component: OurCrriculam;
  let fixture: ComponentFixture<OurCrriculam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurCrriculam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurCrriculam);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
