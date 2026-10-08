-- SUBCONSULTAS

-- 1. Registros de acceso con persona, empresa de procedencia y vigilante que lo autorizó
select ra.idregistro_acceso, pa.primer_nombre, pa.primer_apellido, ep.nombre_empresa, ra.hora_entrada, ra.hora_salida, u.nombre AS vigilante, u.apellido AS apellido_vigilante
from registro_acceso ra
inner join persona_acceso pa on ra.idpersona_acceso = pa.idpersona_acceso
inner join empresa_procedencia ep on pa.idempresa_procedencia = ep.idempresa_procedencia
inner join turno t on ra.idturno = t.idturno
inner join usuarios u on t.idusuario = u.idusuario;

-- 2. Empleados con un puntaje de evaluación mayor al promedio general de puntajes
		select u.nombre, u.apellido, ev.puntaje_numerico, ev.fecha_evaluacion, td.nombre_tipo AS tipo_documento
		from evaluacion_desempeño ev
		inner join empleado emp on ev.idempleado = emp.idempleado
		inner join usuarios u on emp.idusuario = u.idusuario
		inner join documento d on emp.iddocumento = d.iddocumento
		inner join tipo_documento td on d.idtipo_documento = td.idtipo_documento
		where ev.puntaje_numerico > (select avg(puntaje_numerico) from evaluacion_desempeño);
 
-- 3. Listar los empleados, su usuario, el conjunto donde trabajan y el puesto que ocupan
select u.nombre_completo as empleado, c.nombre_conjunto as complejo_residencial, pv.nombre_identificador as puesto_trabajo, e.historial_laboral
from empleado e
inner join usuarios u on e.idusuario = u.idusuario
inner join turno t on u.idusuario = t.idusuario
inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia
inner join conjunto c on pv.idconjunto = c.idconjunto;

-- 4. Objetos perdidos hallados en puestos donde ocurrió más de una novedad
select op.nombre_objeto, op.fecha_hallazgo, pv.nombre_identificador, c.nombre_conjunto
from objeto_perdido op
inner join puesto_vigilancia pv on op.idpuesto_vigilancia = pv.idpuesto_vigilancia
inner join conjunto c on pv.idconjunto = c.idconjunto
inner join evidencia e on op.idevidencia = e.idevidencia
where pv.idpuesto_vigilancia in 
(select t.idpuesto_vigilancia 
from turno t 
inner join novedades n on n.idturno = t.idturno 
group by t.idpuesto_vigilancia 
having count(n.idnovedad) > 1);
 
-- 5. Listar cada puesto de vigilancia junto con la cantidad total de objetos perdidos registrados en él
select pv.nombre_identificador as puesto, c.nombre_conjunto, tp.nombre_tipo AS tipo_puesto,
(select count(op.idobjeto_perdido) 
from objeto_perdido op 
where op.idpuesto_vigilancia = pv.idpuesto_vigilancia) as total_objetos_perdidos
from puesto_vigilancia pv
inner join conjunto c on pv.idconjunto = c.idconjunto
inner join tipo_puesto tp on pv.idtipo_puesto = tp.idtipo_puesto;

-- 6. Vigilantes que han tenido turnos en puestos donde también se reportó un objeto perdido
		select u.nombre, u.apellido, r.nombre_rol, t.fecha, pv.nombre_identificador
		from turno t
		inner join usuarios u on t.idusuario = u.idusuario
		inner join roles r on u.idroles = r.idroles
		inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia
		where pv.idpuesto_vigilancia in (select idpuesto_vigilancia from objeto_perdido);

-- 7. Vehículos registrados por una persona que también aparece como destinataria de un pedido
		select v.placa, v.marca, v.modelo, pa.primer_nombre, pa.primer_apellido
		from vehiculo v
		inner join vehiculos_personas vp on v.idvehiculo = vp.id_vehiculo
		inner join persona_acceso pa on vp.id_personas_acceso = pa.idpersona_acceso
		inner join registro_acceso ra on ra.idpersona_acceso = pa.idpersona_acceso
		where concat(pa.primer_nombre, ' ', pa.primer_apellido) in (select nombre_destinatario from pedido);

-- 8. Turnos suspendidos y el estado del contrato del conjunto donde ocurren
		select t.idturno, u.nombre, u.apellido, c.nombre_conjunto, ct.estado AS estado_contrato
		from  turno t
		inner join usuarios u on t.idusuario = u.idusuario
		inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia
		inner join conjunto c on pv.idconjunto = c.idconjunto
		inner join contrato ct on ct.idconjunto = c.idconjunto
		where t.estado = 'Suspendido';

-- 9. Empleados con más de una advertencia del mismo motivo 
		select u.nombre, u.apellido, ad.motivo, COUNT(*) AS veces_reincidente
		from advertencia_disciplinaria ad
		inner join empleado emp on ad.idempleado = emp.idempleado
		inner join usuarios u on emp.idusuario = u.idusuario
		inner join documento d on emp.iddocumento = d.iddocumento
		group by u.nombre, u.apellido, ad.motivo
		having count(*) > 1;

-- 10. Marcas de vehículos más comunes entre visitantes registrados
select v.marca, COUNT(*) as total_vehiculos
from vehiculo v
inner join vehiculos_personas vp on v.idvehiculo = vp.id_vehiculo
inner join persona_acceso pa on vp.id_personas_acceso = pa.idpersona_acceso
where pa.tipo_persona = 'Visitante'
group by v.marca
order by total_vehiculos desc;