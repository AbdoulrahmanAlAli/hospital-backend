export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Hospital Management API',
    version: '1.0.0',
    description: 'REST API for hospital management: users, patients, doctors, appointments, tests, prescriptions, inventory, billing, notifications, and shifts.'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Login using email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'manager@hospital.local' },
                  password: { type: 'string', example: 'Admin@123456' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Authenticated' } }
      }
    },
    '/patients/{patientId}/tests/{testId}/pdf': {
      get: {
        summary: 'Display decrypted patient analysis PDF',
        parameters: [
          { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'testId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'PDF stream' } }
      },
      post: {
        summary: 'Upload encrypted PDF for a patient analysis. Only the assigned doctor can upload.',
        parameters: [
          { name: 'patientId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'testId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { pdf: { type: 'string', format: 'binary' } } } } }
        },
        responses: { '200': { description: 'Encrypted PDF saved' } }
      }
    }
  }
};
