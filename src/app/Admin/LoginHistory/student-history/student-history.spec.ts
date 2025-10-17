import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentHistory } from './student-history';

describe('StudentHistory', () => {
  let component: StudentHistory;
  let fixture: ComponentFixture<StudentHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
