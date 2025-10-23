import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamcontrollerHomepage } from './examcontroller-homepage';

describe('ExamcontrollerHomepage', () => {
  let component: ExamcontrollerHomepage;
  let fixture: ComponentFixture<ExamcontrollerHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamcontrollerHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamcontrollerHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
