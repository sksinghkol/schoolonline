import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Medals } from './medals';

describe('Medals', () => {
  let component: Medals;
  let fixture: ComponentFixture<Medals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Medals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Medals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
