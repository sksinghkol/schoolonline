import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherMenu } from './teacher-menu';

describe('TeacherMenu', () => {
  let component: TeacherMenu;
  let fixture: ComponentFixture<TeacherMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
