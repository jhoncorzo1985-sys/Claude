/**
 * RSMV — Servicio de Marecoin
 * Toda la economía del juego pasa por aquí.
 * Sin Marecoin no hay acceso. Sin excepciones.
 */

const { supabaseAdmin } = require('../config/supabase');

/**
 * Obtener saldo actual de un usuario
 */
async function getSaldo(userId) {
  const { data, error } = await supabaseAdmin
    .from('perfiles')
    .select('marecoin_saldo')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Error obteniendo saldo Marecoin');
  return data.marecoin_saldo;
}

/**
 * Obtener tarifa de una acción
 */
async function getTarifa(accion) {
  const { data, error } = await supabaseAdmin
    .from('marecoin_tarifas')
    .select('costo, descripcion')
    .eq('accion', accion)
    .eq('activo', true)
    .single();

  if (error || !data) throw new Error(`Acción no encontrada: ${accion}`);
  return data;
}

/**
 * Cobrar Marecoin por una acción
 * Retorna true si exitoso, lanza error si no tiene saldo
 */
async function cobrar(userId, accion, descripcionCustom = null) {
  const tarifa = await getTarifa(accion);
  const saldoActual = await getSaldo(userId);

  if (saldoActual < tarifa.costo) {
    const error = new Error('Saldo insuficiente de Marecoin');
    error.code = 'MARECOIN_INSUFICIENTE';
    error.saldoActual = saldoActual;
    error.costoRequerido = tarifa.costo;
    throw error;
  }

  const saldoNuevo = saldoActual - tarifa.costo;

  // Actualizar saldo
  const { error: updateError } = await supabaseAdmin
    .from('perfiles')
    .update({ marecoin_saldo: saldoNuevo })
    .eq('id', userId);

  if (updateError) throw new Error('Error actualizando saldo');

  // Registrar transacción
  await supabaseAdmin.from('marecoin_transacciones').insert({
    user_id: userId,
    tipo: 'gasto_informacion',
    cantidad: -tarifa.costo,
    saldo_anterior: saldoActual,
    saldo_nuevo: saldoNuevo,
    descripcion: descripcionCustom || tarifa.descripcion
  });

  return { saldoAnterior: saldoActual, saldoNuevo, costoAplicado: tarifa.costo };
}

/**
 * Acreditar Marecoin (premios, ganancias)
 */
async function acreditar(userId, cantidad, tipo, descripcion, referenciaId = null) {
  if (cantidad <= 0) throw new Error('La cantidad debe ser positiva');

  const saldoActual = await getSaldo(userId);
  const saldoNuevo = saldoActual + cantidad;

  const { error: updateError } = await supabaseAdmin
    .from('perfiles')
    .update({ marecoin_saldo: saldoNuevo })
    .eq('id', userId);

  if (updateError) throw new Error('Error acreditando Marecoin');

  await supabaseAdmin.from('marecoin_transacciones').insert({
    user_id: userId,
    tipo,
    cantidad,
    saldo_anterior: saldoActual,
    saldo_nuevo: saldoNuevo,
    descripcion,
    referencia_id: referenciaId
  });

  return { saldoAnterior: saldoActual, saldoNuevo, acreditado: cantidad };
}

/**
 * Historial de transacciones
 */
async function getHistorial(userId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('marecoin_transacciones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error('Error obteniendo historial');
  return data;
}

/**
 * Verificar si puede pagar (sin cobrar)
 */
async function puedePagar(userId, accion) {
  const tarifa = await getTarifa(accion);
  const saldo = await getSaldo(userId);
  return { puede: saldo >= tarifa.costo, saldo, costo: tarifa.costo };
}

module.exports = { getSaldo, getTarifa, cobrar, acreditar, getHistorial, puedePagar };
