import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorLogin } from './director-login';

describe('DirectorLogin', () => {
  let component: DirectorLogin;
  let fixture: ComponentFixture<DirectorLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
