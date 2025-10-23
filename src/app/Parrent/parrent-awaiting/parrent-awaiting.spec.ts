import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParrentAwaiting } from './parrent-awaiting';

describe('ParrentAwaiting', () => {
  let component: ParrentAwaiting;
  let fixture: ComponentFixture<ParrentAwaiting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParrentAwaiting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParrentAwaiting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
