import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdepartmentMenu } from './itdepartment-menu';

describe('ItdepartmentMenu', () => {
  let component: ItdepartmentMenu;
  let fixture: ComponentFixture<ItdepartmentMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdepartmentMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItdepartmentMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
