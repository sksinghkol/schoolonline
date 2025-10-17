import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorHomepage } from './director-homepage';

describe('DirectorHomepage', () => {
  let component: DirectorHomepage;
  let fixture: ComponentFixture<DirectorHomepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorHomepage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorHomepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
