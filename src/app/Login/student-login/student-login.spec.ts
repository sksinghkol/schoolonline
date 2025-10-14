import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { StudentLogin } from './student-login';
import { AuthService } from '../../core/services/student.auth.service';

class MockAuthService {
  loginWithGoogle(schoolCode: string) {
    // The real service navigates internally. We can simulate a successful promise resolution.
    return Promise.resolve({ user: {} });
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

describe('StudentLogin', () => {
  let component: StudentLogin;
  let fixture: ComponentFixture<StudentLogin>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLogin, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ schoolId: 'test-school-123' }) }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentLogin);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loginWithGoogle on the auth service when the google login button is clicked', async () => {
    spyOn(authService, 'loginWithGoogle').and.callThrough();
    await component.loginWithGoogle();
    expect(authService.loginWithGoogle).toHaveBeenCalledWith('test-school-123');
  });
});
