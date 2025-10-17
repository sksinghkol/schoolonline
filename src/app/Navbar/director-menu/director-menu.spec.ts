import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorMenu } from './director-menu';

describe('DirectorMenu', () => {
  let component: DirectorMenu;
  let fixture: ComponentFixture<DirectorMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
