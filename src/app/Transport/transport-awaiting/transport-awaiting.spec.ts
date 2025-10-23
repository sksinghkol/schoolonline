import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportAwaiting } from './transport-awaiting';

describe('TransportAwaiting', () => {
  let component: TransportAwaiting;
  let fixture: ComponentFixture<TransportAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
