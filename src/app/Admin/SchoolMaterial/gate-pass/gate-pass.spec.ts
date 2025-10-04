import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GatePass } from './gate-pass';

describe('GatePass', () => {
  let component: GatePass;
  let fixture: ComponentFixture<GatePass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatePass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GatePass);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
