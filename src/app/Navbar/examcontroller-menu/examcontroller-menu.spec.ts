import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamcontrollerMenu } from './examcontroller-menu';

describe('ExamcontrollerMenu', () => {
  let component: ExamcontrollerMenu;
  let fixture: ComponentFixture<ExamcontrollerMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamcontrollerMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamcontrollerMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
