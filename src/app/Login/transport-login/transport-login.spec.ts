import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportLogin } from './transport-login';

describe('TransportLogin', () => {
  let component: TransportLogin;
  let fixture: ComponentFixture<TransportLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
