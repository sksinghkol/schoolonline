import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurSyllabus } from './our-syllabus';

describe('OurSyllabus', () => {
  let component: OurSyllabus;
  let fixture: ComponentFixture<OurSyllabus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurSyllabus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurSyllabus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
