import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffMenu } from './staff-menu';

describe('StaffMenu', () => {
  let component: StaffMenu;
  let fixture: ComponentFixture<StaffMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
