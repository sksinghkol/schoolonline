import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VistorsPass } from './vistors-pass';

describe('VistorsPass', () => {
  let component: VistorsPass;
  let fixture: ComponentFixture<VistorsPass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VistorsPass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VistorsPass);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
