import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentsVideo } from './students-video';

describe('StudentsVideo', () => {
  let component: StudentsVideo;
  let fixture: ComponentFixture<StudentsVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentsVideo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
