import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentOutpass } from './student-outpass';

describe('StudentOutpass', () => {
  let component: StudentOutpass;
  let fixture: ComponentFixture<StudentOutpass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentOutpass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentOutpass);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
