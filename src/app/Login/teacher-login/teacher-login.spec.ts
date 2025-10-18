import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherLogin } from './teacher-login';

describe('TeacherLogin', () => {
  let component: TeacherLogin;
  let fixture: ComponentFixture<TeacherLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
