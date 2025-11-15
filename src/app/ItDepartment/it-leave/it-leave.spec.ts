import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItLeave } from './it-leave';

describe('ItLeave', () => {
  let component: ItLeave;
  let fixture: ComponentFixture<ItLeave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItLeave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItLeave);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
