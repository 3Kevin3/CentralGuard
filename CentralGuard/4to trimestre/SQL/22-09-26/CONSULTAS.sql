-- CONSULTAS

-- 1. Turnos con vigilante, puesto, tipo de puesto y conjunto
select u.nombre, u.apellido, t.fecha, t.hora_inicio, t.hora_fin, pv.nombre_identificador, tp.nombre_tipo as tipo_puesto, c.nombre_conjunto
from turno t
inner join usuarios u on t.idusuario = u.idusuario
inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia
inner join tipo_puesto tp on pv.idtipo_puesto = tp.idtipo_puesto
inner join conjunto c on pv.idconjunto = c.idconjunto;
 
-- 2. Novedades reportadas con su tipo, detallles, vigilante y puesto de vigilancia
		select n.idnovedad, tn.nombre_tipo as Tipo_novedad, n.descripcion_hechos as Detalles, n.hora_reporte, n.estado, u.nombre, u.apellido, pv.nombre_identificador
		from novedades n
		inner join tipo_novedad tn on n.idtipo_novedad = tn.idtipo_novedad
		inner join turno t on n.idturno = t.idturno
		inner join usuarios u on t.idusuario = u.idusuario
		inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia;
 
 -- 3. Equipos actualmente asignados con el usuario y su rol
		select eq.nombre_activo, eq.serial_unico, eq.estado, u.nombre, u.apellido, r.nombre_rol, ae.fecha_entrega
		from asignacion_equipo ae
		inner join equipo eq on ae.idequipo = eq.idequipo
		inner join usuarios u on ae.idusuario = u.idusuario
		inner join roles r on u.idroles = r.idroles
		where ae.fecha_devolucion is null;

-- 4. Pedidos en custodia con su registro de acceso, persona que lo trajo y turno
		select p.nombre_pedido, p.nombre_destinatario, p.estado, ra.apartamento_destino, pa.primer_nombre, pa.primer_apellido, t.fecha
		from pedido p
		inner join registro_acceso ra on p.idregistro_acceso = ra.idregistro_acceso
		inner join persona_acceso pa on ra.idpersona_acceso = pa.idpersona_acceso
		inner join turno t on ra.idturno = t.idturno
		where p.estado = 'En Custodia';

-- 5. Objetos perdidos con su puesto de vigilancia, tipo de puesto y conjunto
select op.nombre_objeto, op.fecha_hallazgo, op.estado, pv.nombre_identificador, tp.nombre_tipo as tipo_puesto, c.nombre_conjunto
from objeto_perdido op
inner join puesto_vigilancia pv on op.idpuesto_vigilancia = pv.idpuesto_vigilancia
inner join tipo_puesto tp on pv.idtipo_puesto = tp.idtipo_puesto
inner join conjunto c on pv.idconjunto = c.idconjunto;

-- 6. Historial laboral de empleados con su rol, usuario y documento
select u.nombre, u.apellido, r.nombre_rol, emp.historial_laboral, emp.reconocimientos
from empleado emp
inner join usuarios u on emp.idusuario = u.idusuario
inner join roles r on u.idroles = r.idroles
inner join documento d on emp.iddocumento = d.iddocumento;
 
 -- 7. Vehículos con la placa, el conductor y su tipo de persona (residente, visitante, domiciliario.)
		select v.placa, v.marca, v.color, pa.primer_nombre, pa.primer_apellido, pa.tipo_persona, vp.es_conductor_principal
		from vehiculo v
		inner join vehiculos_personas vp on v.idvehiculo = vp.id_vehiculo
		inner join persona_acceso pa on vp.id_personas_acceso = pa.idpersona_acceso
		inner join empresa_procedencia ep on pa.idempresa_procedencia = ep.idempresa_procedencia
		where pa.tipo_persona = 'Visitante';

-- 8. Turnos que no registraron ninguna ronda de vigilancia
select c.nombre_conjunto, tn.nombre_tipo AS tipo_novedad, COUNT(n.idnovedad) AS total
from novedades n
inner join turno t on n.idturno = t.idturno
inner join puesto_vigilancia pv on t.idpuesto_vigilancia = pv.idpuesto_vigilancia
inner join conjunto c on pv.idconjunto = c.idconjunto
inner join tipo_novedad tn on n.idtipo_novedad = tn.idtipo_novedad
group by c.nombre_conjunto, tn.nombre_tipo
order by c.nombre_conjunto, total desc;

-- 9. Vigilantes con más advertencias disciplinarias acumuladas
select u.nombre, u.apellido, r.nombre_rol, COUNT(ad.idadvertencia_disciplinaria) AS total_advertencias
from advertencia_disciplinaria ad
inner join empleado emp on ad.idempleado = emp.idempleado
inner join usuarios u on emp.idusuario = u.idusuario
inner join roles r on u.idroles = r.idroles
group by u.nombre, u.apellido, r.nombre_rol
order by total_advertencias desc;

-- 10. Equipos dañados o en mal estado, con el último usuario que los tuvo asignado
		select eq.nombre_activo, eq.serial_unico, eq.estado, u.nombre, u.apellido, ae.fecha_entrega, ae.fecha_devolucion
		from equipo eq
		inner join asignacion_equipo ae on eq.idequipo = ae.idequipo
		inner join usuarios u on ae.idusuario = u.idusuario
		inner join roles r on u.idroles = r.idroles
		where eq.estado <> 'Bueno';


