import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Brochure } from './brochure';

describe('Brochure', () => {
  let component: Brochure;
  let fixture: ComponentFixture<Brochure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Brochure]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Brochure);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
