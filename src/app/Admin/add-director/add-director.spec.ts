import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDirector } from './add-director';

describe('AddDirector', () => {
  let component: AddDirector;
  let fixture: ComponentFixture<AddDirector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDirector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDirector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
