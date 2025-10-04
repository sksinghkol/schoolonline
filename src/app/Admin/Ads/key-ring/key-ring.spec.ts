import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyRing } from './key-ring';

describe('KeyRing', () => {
  let component: KeyRing;
  let fixture: ComponentFixture<KeyRing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyRing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyRing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
