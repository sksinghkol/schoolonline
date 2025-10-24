import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewQuestionPapers } from './view-question-papers';

describe('ViewQuestionPapers', () => {
  let component: ViewQuestionPapers;
  let fixture: ComponentFixture<ViewQuestionPapers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewQuestionPapers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewQuestionPapers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
