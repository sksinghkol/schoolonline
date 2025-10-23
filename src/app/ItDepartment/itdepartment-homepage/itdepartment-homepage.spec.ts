import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdepartmentHomepage } from './itdepartment-homepage';

describe('ItdepartmentHomepage', () => {
  let component: ItdepartmentHomepage;
  let fixture: ComponentFixture<ItdepartmentHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdepartmentHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItdepartmentHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
