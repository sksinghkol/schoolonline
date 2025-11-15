import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAlluser } from './admin-alluser';

describe('AdminAlluser', () => {
  let component: AdminAlluser;
  let fixture: ComponentFixture<AdminAlluser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAlluser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAlluser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
