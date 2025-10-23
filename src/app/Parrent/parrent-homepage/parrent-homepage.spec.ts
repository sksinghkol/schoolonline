import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParrentHomepage } from './parrent-homepage';

describe('ParrentHomepage', () => {
  let component: ParrentHomepage;
  let fixture: ComponentFixture<ParrentHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParrentHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParrentHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
