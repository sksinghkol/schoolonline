import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherYoutube } from './teacher-youtube';

describe('TeacherYoutube', () => {
  let component: TeacherYoutube;
  let fixture: ComponentFixture<TeacherYoutube>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherYoutube]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherYoutube);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
