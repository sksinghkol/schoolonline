import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskHomepage } from './frontdesk-homepage';

describe('FrontdeskHomepage', () => {
  let component: FrontdeskHomepage;
  let fixture: ComponentFixture<FrontdeskHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
