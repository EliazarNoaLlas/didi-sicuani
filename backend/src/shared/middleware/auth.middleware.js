import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticación JWT
 */
export const autenticar = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ exito: false, mensaje: 'No se proporcionó token' });
    }

    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodificado;
    req.usuario = decodificado;

    if (!req.user.tipoUsuario && req.user.userType) {
      req.user.tipoUsuario = req.user.userType;
      req.usuario.tipoUsuario = req.user.userType;
    }

    next();
  } catch (error) {
    return res.status(401).json({ exito: false, mensaje: 'Token inválido o expirado' });
  }
};

/**
 * Middleware de Autorización por roles
 */
export const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ exito: false, mensaje: 'Autenticación requerida' });
    }

    const tipoUsuarioToken = req.user.tipoUsuario || req.user.userType;
    const tipoMap = {
      passenger: 'pasajero',
      driver: 'conductor',
      admin: 'administrador',
      pasajero: 'pasajero',
      conductor: 'conductor',
      administrador: 'administrador',
    };

    const tipoEsp = tipoMap[tipoUsuarioToken] || tipoUsuarioToken;
    const rolesEsp = roles.map((r) => tipoMap[r] || r);

    if (!rolesEsp.includes(tipoEsp)) {
      return res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado. Rol requerido: ${roles.join(' o ')}, tienes: ${tipoUsuarioToken || 'ninguno'}`,
        rolesRequeridos: roles,
        tuRol: tipoUsuarioToken,
      });
    }

    next();
  };
};

// Aliases para compatibilidad
export const authenticate = autenticar;
export const authorize = autorizar;
