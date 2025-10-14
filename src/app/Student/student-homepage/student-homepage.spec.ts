import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentHomepage } from './student-homepage';

describe('StudentHomepage', () => {
  let component: StudentHomepage;
  let fixture: ComponentFixture<StudentHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
