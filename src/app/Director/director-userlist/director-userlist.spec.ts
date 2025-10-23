import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorUserlist } from './director-userlist';

describe('DirectorUserlist', () => {
  let component: DirectorUserlist;
  let fixture: ComponentFixture<DirectorUserlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorUserlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorUserlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
