import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherProfile } from './teacher-profile';

describe('TeacherProfile', () => {
  let component: TeacherProfile;
  let fixture: ComponentFixture<TeacherProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
