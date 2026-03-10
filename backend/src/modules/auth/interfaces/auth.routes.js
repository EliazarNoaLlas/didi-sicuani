import express from 'express';
import { body, validationResult } from 'express-validator';

const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Datos de entrada inválidos',
      errores: errores.array(),
    });
  }
  next();
};

export function createAuthRouter(controller) {
  const enrutador = express.Router();

  enrutador.get('/', (req, res) => {
    res.json({
      exito: true,
      mensaje: 'Endpoints de autenticación disponibles',
      endpoints: [
        { metodo: 'POST', ruta: '/login', descripcion: 'Iniciar sesión' },
        { metodo: 'POST', ruta: '/register', descripcion: 'Registrar nuevo usuario' },
      ],
      documentacion: '/api-docs',
    });
  });

  enrutador.post(
    '/login',
    [
      body('correo').isEmail().withMessage('Se requiere un correo electrónico válido'),
      body('contrasena').notEmpty().withMessage('Se requiere la contraseña'),
    ],
    manejarErroresValidacion,
    controller.iniciarSesion
  );

  enrutador.post(
    '/register',
    [
      body('correo').isEmail().withMessage('Se requiere un correo electrónico válido'),
      body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
      body('nombre').notEmpty().withMessage('Se requiere el nombre'),
      body('tipoUsuario').isIn(['pasajero', 'conductor']).withMessage('Tipo de usuario inválido'),
    ],
    manejarErroresValidacion,
    controller.registrar
  );

  return enrutador;
}
