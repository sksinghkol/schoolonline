import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportHomepage } from './transport-homepage';

describe('TransportHomepage', () => {
  let component: TransportHomepage;
  let fixture: ComponentFixture<TransportHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
