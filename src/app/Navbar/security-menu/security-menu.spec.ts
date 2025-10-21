import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityMenu } from './security-menu';

describe('SecurityMenu', () => {
  let component: SecurityMenu;
  let fixture: ComponentFixture<SecurityMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
