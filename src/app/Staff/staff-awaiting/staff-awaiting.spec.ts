import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffAwaiting } from './staff-awaiting';

describe('StaffAwaiting', () => {
  let component: StaffAwaiting;
  let fixture: ComponentFixture<StaffAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
