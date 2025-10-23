import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityAwaiting } from './security-awaiting';

describe('SecurityAwaiting', () => {
  let component: SecurityAwaiting;
  let fixture: ComponentFixture<SecurityAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
