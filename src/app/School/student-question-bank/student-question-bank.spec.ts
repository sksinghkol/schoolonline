import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentQuestionBank } from './student-question-bank';

describe('StudentQuestionBank', () => {
  let component: StudentQuestionBank;
  let fixture: ComponentFixture<StudentQuestionBank>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentQuestionBank]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentQuestionBank);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
