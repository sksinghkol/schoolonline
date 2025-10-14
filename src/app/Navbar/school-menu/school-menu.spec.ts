import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolMenu } from './school-menu';

describe('SchoolMenu', () => {
  let component: SchoolMenu;
  let fixture: ComponentFixture<SchoolMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchoolMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchoolMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
