import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperHome } from './super-home';

describe('SuperHome', () => {
  let component: SuperHome;
  let fixture: ComponentFixture<SuperHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuperHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
