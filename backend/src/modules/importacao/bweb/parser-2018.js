import { CAMPOS_2018_42 } from './campos.js';
import { parsearRegistro, validarCabecalho } from './parser-45.js';

export function validarCabecalho2018(camposBrutos) {
  return validarCabecalho(camposBrutos, CAMPOS_2018_42);
}

export function parsearRegistro2018(campos, headerMap, nrLinha) {
  return parsearRegistro(campos, headerMap, nrLinha);
}
