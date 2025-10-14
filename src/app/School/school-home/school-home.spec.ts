import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolHome } from './school-home';

describe('SchoolHome', () => {
  let component: SchoolHome;
  let fixture: ComponentFixture<SchoolHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
