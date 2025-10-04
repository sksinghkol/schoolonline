import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hooks } from './hooks';

describe('Hooks', () => {
  let component: Hooks;
  let fixture: ComponentFixture<Hooks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hooks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hooks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
