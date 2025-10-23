import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamcontrollerLogin } from './examcontroller-login';

describe('ExamcontrollerLogin', () => {
  let component: ExamcontrollerLogin;
  let fixture: ComponentFixture<ExamcontrollerLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamcontrollerLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamcontrollerLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
