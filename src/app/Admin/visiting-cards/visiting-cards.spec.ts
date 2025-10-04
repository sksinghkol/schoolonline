import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitingCards } from './visiting-cards';

describe('VisitingCards', () => {
  let component: VisitingCards;
  let fixture: ComponentFixture<VisitingCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitingCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitingCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
