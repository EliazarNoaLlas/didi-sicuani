export class AuthController {
  constructor(loginUseCase, registerUseCase) {
    this.loginUseCase = loginUseCase;
    this.registerUseCase = registerUseCase;
    this.iniciarSesion = this.iniciarSesion.bind(this);
    this.registrar = this.registrar.bind(this);
  }

  async iniciarSesion(req, res) {
    try {
      const { correo, contrasena } = req.body;
      const resultado = await this.loginUseCase.execute({ correo, contrasena });
      res.json({ exito: true, datos: resultado });
    } catch (error) {
      const status = error.statusCode || 401;
      res.status(status).json({ exito: false, mensaje: error.message });
    }
  }

  async registrar(req, res) {
    try {
      const { correo, contrasena, nombre, tipoUsuario, telefono } = req.body;
      const resultado = await this.registerUseCase.execute({
        correo,
        contrasena,
        nombre,
        tipoUsuario,
        telefono,
      });
      res.status(201).json({
        exito: true,
        mensaje: 'Usuario registrado exitosamente',
        datos: resultado,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      res.status(status).json({ exito: false, mensaje: error.message });
    }
  }
}
