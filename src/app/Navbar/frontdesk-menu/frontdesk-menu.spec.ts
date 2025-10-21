import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontdeskMenu } from './frontdesk-menu';

describe('FrontdeskMenu', () => {
  let component: FrontdeskMenu;
  let fixture: ComponentFixture<FrontdeskMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrontdeskMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FrontdeskMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
