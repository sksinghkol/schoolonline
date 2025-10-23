import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParrentMenu } from './parrent-menu';

describe('ParrentMenu', () => {
  let component: ParrentMenu;
  let fixture: ComponentFixture<ParrentMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParrentMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParrentMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
