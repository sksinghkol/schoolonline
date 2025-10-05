import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanyardsDesign } from './lanyards-design';

describe('LanyardsDesign', () => {
  let component: LanyardsDesign;
  let fixture: ComponentFixture<LanyardsDesign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanyardsDesign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanyardsDesign);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
