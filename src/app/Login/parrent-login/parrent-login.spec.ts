import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParrentLogin } from './parrent-login';

describe('ParrentLogin', () => {
  let component: ParrentLogin;
  let fixture: ComponentFixture<ParrentLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParrentLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParrentLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
