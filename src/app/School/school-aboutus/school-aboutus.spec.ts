import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolAboutus } from './school-aboutus';

describe('SchoolAboutus', () => {
  let component: SchoolAboutus;
  let fixture: ComponentFixture<SchoolAboutus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolAboutus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolAboutus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
