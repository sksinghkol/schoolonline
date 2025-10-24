import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherQuestionbank } from './teacher-questionbank';

describe('TeacherQuestionbank', () => {
  let component: TeacherQuestionbank;
  let fixture: ComponentFixture<TeacherQuestionbank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherQuestionbank]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherQuestionbank);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
