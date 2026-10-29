import { ZodError } from 'zod';
import { AppError } from './erros.js';

export function validar(schema, dados) {
  try {
    return schema.parse(dados);
  } catch (erro) {
    if (erro instanceof ZodError) {
      throw new AppError(
        'VALIDATION',
        400,
        'Parâmetro inválido',
        erro.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    throw erro;
  }
}
