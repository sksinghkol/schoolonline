import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TexamQuestion } from './texam-question';

describe('TexamQuestion', () => {
  let component: TexamQuestion;
  let fixture: ComponentFixture<TexamQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TexamQuestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TexamQuestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
