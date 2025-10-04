import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsDesign } from './cards-design';

describe('CardsDesign', () => {
  let component: CardsDesign;
  let fixture: ComponentFixture<CardsDesign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsDesign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsDesign);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
