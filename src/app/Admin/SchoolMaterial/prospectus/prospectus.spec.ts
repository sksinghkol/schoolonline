import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prospectus } from './prospectus';

describe('Prospectus', () => {
  let component: Prospectus;
  let fixture: ComponentFixture<Prospectus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prospectus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Prospectus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
