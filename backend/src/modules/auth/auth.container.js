import { AuthMongoRepository } from './infrastructure/auth.mongo.repository.js';
import { LoginUseCase } from './application/login.usecase.js';
import { RegisterUseCase } from './application/register.usecase.js';
import { AuthController } from './interfaces/auth.controller.js';
import { createAuthRouter } from './interfaces/auth.routes.js';

export function buildAuthContainer() {
  const authRepository = new AuthMongoRepository();

  const loginUseCase = new LoginUseCase(authRepository);
  const registerUseCase = new RegisterUseCase(authRepository);

  const controller = new AuthController(loginUseCase, registerUseCase);
  const router = createAuthRouter(controller);

  return { router };
}
