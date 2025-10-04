import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Holder } from './holder';

describe('Holder', () => {
  let component: Holder;
  let fixture: ComponentFixture<Holder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Holder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Holder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
