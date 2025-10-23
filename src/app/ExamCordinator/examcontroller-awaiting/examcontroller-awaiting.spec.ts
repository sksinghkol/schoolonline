import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamcontrollerAwaiting } from './examcontroller-awaiting';

describe('ExamcontrollerAwaiting', () => {
  let component: ExamcontrollerAwaiting;
  let fixture: ComponentFixture<ExamcontrollerAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamcontrollerAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamcontrollerAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
