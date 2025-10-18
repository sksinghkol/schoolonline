import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherAwating } from './teacher-awating';

describe('TeacherAwating', () => {
  let component: TeacherAwating;
  let fixture: ComponentFixture<TeacherAwating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherAwating]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherAwating);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
