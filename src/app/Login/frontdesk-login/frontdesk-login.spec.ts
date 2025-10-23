import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskLogin } from './frontdesk-login';

describe('FrontdeskLogin', () => {
  let component: FrontdeskLogin;
  let fixture: ComponentFixture<FrontdeskLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
