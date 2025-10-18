import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherHomepage } from './teacher-homepage';

describe('TeacherHomepage', () => {
  let component: TeacherHomepage;
  let fixture: ComponentFixture<TeacherHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
