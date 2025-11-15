import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurCourses } from './our-courses';

describe('OurCourses', () => {
  let component: OurCourses;
  let fixture: ComponentFixture<OurCourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurCourses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurCourses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
