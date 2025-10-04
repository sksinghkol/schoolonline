import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lanyards } from './lanyards';

describe('Lanyards', () => {
  let component: Lanyards;
  let fixture: ComponentFixture<Lanyards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lanyards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lanyards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
