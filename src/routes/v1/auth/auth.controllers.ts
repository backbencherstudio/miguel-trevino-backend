import { FastifyRequest, FastifyReply } from 'fastify';

// Interfaces para las solicitudes
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Controlador para el login
export const login = async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply)=> {
  try {
    const { email, password } = request.body;
    
    // Aquí iría la lógica de autenticación real
    // Por ahora, solo devolvemos una respuesta simulada
    
    return reply.code(200).send({
      success: true,
      message: 'Login exitoso',
      data: {
        token: 'jwt-token-simulado',
        user: {
          email,
          name: 'Usuario Simulado'
        }
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Controlador para el registro
export const register = async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
  try {
    const { name, email, password } = request.body;
    const prisma = request.server.prisma;
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findFirst({
      where: { name: email } // Usando el campo name como email temporalmente
    });
    
    if (existingUser) {
      return reply.code(400).send({
        success: false,
        message: 'El usuario ya existe'
      });
    }
    
    // Crear nuevo usuario
    const newUser = await prisma.user.create({
      data: {
        name: name
        // Aquí se agregarían más campos cuando se actualice el modelo
      }
    });
    
    return reply.code(201).send({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name
        }
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Controlador para obtener el perfil del usuario
export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Aquí iría la lógica para obtener el perfil del usuario autenticado
    // Por ahora, solo devolvemos una respuesta simulada
    
    return reply.code(200).send({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: {
        user: {
          id: 1,
          name: 'Usuario Simulado',
          email: 'usuario@ejemplo.com'
        }
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: 'Error en el servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}