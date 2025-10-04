import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdCardsData } from './id-cards-data';

describe('IdCardsData', () => {
  let component: IdCardsData;
  let fixture: ComponentFixture<IdCardsData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdCardsData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdCardsData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
