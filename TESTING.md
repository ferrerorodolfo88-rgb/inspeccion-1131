# 🧪 Guía de Pruebas - Inspección 1131

Esta guía te ayudará a verificar que todas las funcionalidades estén operando correctamente.

## ✅ Lista de Verificación

### Autenticación

- [ ] **Registro de usuario**
  - Crear cuenta con email y contraseña
  - Verificar validación de campos (email válido, contraseña mínimo 6 caracteres)
  - Verificar que no se puedan crear usuarios duplicados
  
- [ ] **Inicio de sesión**
  - Login con credenciales correctas
  - Manejo de errores con credenciales incorrectas
  - Persistencia de sesión (recargar página mantiene sesión)
  
- [ ] **Cierre de sesión**
  - Botón de logout funciona
  - Redirige al login
  - Limpia los datos locales

### Gestión de Registros

- [ ] **Crear registro**
  - Botón flotante "+" abre el modal
  - Todos los campos se guardan correctamente
  - Fecha por defecto es hoy
  - Validación de campos obligatorios
  - Mensaje de éxito al guardar
  
- [ ] **Leer registros**
  - Los registros se cargan automáticamente
  - Se muestran en orden cronológico (más recientes primero)
  - Los colores por tipo de documento son correctos
  - El detalle muestra toda la información
  
- [ ] **Actualizar registro**
  - Botón "editar" abre el modal con datos precargados
  - Los cambios se guardan correctamente
  - La fecha de actualización se registra
  - Solo el creador o admin puede editar
  
- [ ] **Eliminar registro**
  - Aparece confirmación antes de eliminar
  - El registro se elimina correctamente
  - Solo el creador o admin puede eliminar

### Búsqueda y Filtros

- [ ] **Búsqueda**
  - Busca en asunto, destinatario, número y observaciones
  - Es case-insensitive (mayúsculas/minúsculas no importan)
  - Actualiza resultados en tiempo real
  - Muestra mensaje cuando no hay resultados
  
- [ ] **Filtro por tipo**
  - Dropdown muestra todos los tipos
  - Filtra correctamente por tipo seleccionado
  - "Todos los tipos" muestra todos los registros
  - Se puede combinar con búsqueda

### Estadísticas

- [ ] **Vista general**
  - Muestra total de registros
  - Muestra cantidad por tipo
  - Los colores coinciden con los tipos
  
- [ ] **Perfil de usuario**
  - Muestra estadísticas personales
  - Cuenta solo los registros del usuario actual
  - Información de perfil correcta

### Exportación

- [ ] **Exportar a CSV**
  - Genera archivo CSV correctamente
  - Incluye todos los registros filtrados
  - El archivo se descarga automáticamente
  - Nombre de archivo incluye fecha
  
- [ ] **Exportar a PDF**
  - Genera archivo PDF correctamente
  - El formato es legible
  - Incluye encabezado con título y fecha
  - Las columnas están bien organizadas

### Sincronización en Tiempo Real

- [ ] **Multi-dispositivo**
  - Abrir en dos pestañas diferentes
  - Crear registro en pestaña 1
  - Verificar que aparece en pestaña 2 automáticamente
  
- [ ] **Multi-usuario**
  - Usuario A crea un registro
  - Usuario B lo ve inmediatamente sin recargar
  
- [ ] **Persistencia offline**
  - Cerrar la conexión a internet
  - La app sigue funcionando con datos locales
  - Al reconectar, sincroniza automáticamente

### Interfaz de Usuario

- [ ] **Responsive Design**
  - Móvil (< 640px): Una columna, navegación inferior
  - Tablet (641-1024px): Dos columnas de registros
  - Desktop (> 1024px): Tres columnas de registros
  
- [ ] **Navegación**
  - Botón "Inicio" va a la lista de registros
  - Botón "Perfil" va al perfil del usuario
  - Navegación se destaca correctamente
  
- [ ] **Modales**
  - Se abren y cierran correctamente
  - El botón "X" cierra el modal
  - Clic fuera del modal NO lo cierra (por seguridad)
  - Formularios se limpian al cerrar

### PWA (Progressive Web App)

- [ ] **Instalación**
  - Aparece el prompt de instalación
  - Se puede instalar en pantalla de inicio
  - El ícono de la app es correcto
  
- [ ] **Offline**
  - Sin conexión, la app carga desde caché
  - Los datos guardados localmente están disponibles
  
- [ ] **Service Worker**
  - Se registra correctamente
  - Cachea los archivos principales
  - Actualiza cuando hay nueva versión

### Seguridad

- [ ] **Autenticación requerida**
  - Sin login, redirige a pantalla de inicio de sesión
  - No se puede acceder a datos sin autenticación
  
- [ ] **Reglas de Firestore**
  - Solo usuarios autenticados leen/escriben
  - Los usuarios solo pueden editar sus propios registros
  - Los admins pueden editar/eliminar cualquier registro

## 🔍 Casos de Prueba Detallados

### Test 1: Flujo Completo de Usuario Nuevo

```
1. Abrir la aplicación
2. Hacer clic en "Registrarse"
3. Ingresar:
   - Nombre: "Juan Pérez"
   - Email: "juan.perez@test.com"
   - Contraseña: "test123"
   - Rol: "Usuario"
4. Hacer clic en "Crear Cuenta"
5. Verificar redirección a pantalla principal
6. Hacer clic en botón "+"
7. Completar formulario de nuevo registro:
   - Tipo: "Nota"
   - Destinatario: "Dirección General"
   - Asunto: "Solicitud de materiales"
   - Número: "NOTA-001"
8. Guardar registro
9. Verificar que aparece en la lista
10. Hacer clic en el registro para ver detalle
11. Editar el registro (cambiar asunto)
12. Verificar que el cambio se guardó
13. Cerrar sesión
14. Volver a iniciar sesión
15. Verificar que el registro sigue ahí
```

**Resultado esperado**: Todo funciona sin errores

### Test 2: Sincronización Multi-Dispositivo

```
1. Dispositivo A: Iniciar sesión
2. Dispositivo B: Iniciar sesión con la misma cuenta
3. Dispositivo A: Crear un nuevo registro
4. Dispositivo B: Verificar que aparece automáticamente (sin recargar)
5. Dispositivo B: Editar el registro
6. Dispositivo A: Verificar que ve los cambios
7. Dispositivo A: Eliminar el registro
8. Dispositivo B: Verificar que desaparece
```

**Resultado esperado**: Sincronización inmediata en ambos dispositivos

### Test 3: Búsqueda y Filtros

```
1. Crear 5 registros de diferentes tipos:
   - 2 Notas
   - 2 Informes
   - 1 Expediente
2. Usar filtro "Nota": Debe mostrar solo 2
3. Usar filtro "Informe": Debe mostrar solo 2
4. Volver a "Todos los tipos": Debe mostrar los 5
5. Buscar por texto en asunto
6. Buscar por destinatario
7. Combinar búsqueda con filtro
```

**Resultado esperado**: Todos los filtros funcionan correctamente

### Test 4: Exportación

```
1. Crear 10 registros variados
2. Aplicar un filtro (ej: solo "Notas")
3. Hacer clic en "Exportar"
4. Exportar a CSV:
   - Verificar que se descarga
   - Abrir en Excel/Sheets
   - Verificar que solo tiene las notas filtradas
5. Exportar a PDF:
   - Verificar que se descarga
   - Abrir el PDF
   - Verificar formato y datos
```

**Resultado esperado**: Archivos se generan correctamente con datos filtrados

### Test 5: Offline/Online

```
1. Iniciar sesión
2. Cargar registros
3. Desconectar internet (modo avión)
4. Verificar que la app sigue funcionando
5. Crear un nuevo registro offline
6. Reconectar internet
7. Verificar que el registro se sincroniza automáticamente
```

**Resultado esperado**: Funciona offline y sincroniza al reconectar

## 🐛 Registro de Bugs

Si encuentras problemas durante las pruebas, documéntalos aquí:

### Bug #1
- **Fecha**: _____
- **Descripción**: _____
- **Pasos para reproducir**: _____
- **Comportamiento esperado**: _____
- **Comportamiento actual**: _____
- **Navegador/Dispositivo**: _____

## 📊 Resultados de Pruebas

| Categoría | Pruebas Totales | Pasadas | Fallidas | % Éxito |
|-----------|----------------|---------|----------|---------|
| Autenticación | 7 | ___ | ___ | ___ |
| Registros | 12 | ___ | ___ | ___ |
| Búsqueda | 4 | ___ | ___ | ___ |
| Estadísticas | 4 | ___ | ___ | ___ |
| Exportación | 6 | ___ | ___ | ___ |
| Sincronización | 6 | ___ | ___ | ___ |
| UI/UX | 9 | ___ | ___ | ___ |
| PWA | 6 | ___ | ___ | ___ |
| Seguridad | 4 | ___ | ___ | ___ |
| **TOTAL** | **58** | ___ | ___ | ___ |

## ✅ Aprobación

- [ ] Todas las pruebas críticas pasan
- [ ] No hay bugs bloqueantes
- [ ] La sincronización funciona correctamente
- [ ] La aplicación es responsive
- [ ] Los datos se persisten correctamente
- [ ] La seguridad está configurada

**Fecha de aprobación**: _____________________

**Responsable**: _____________________

**Firma**: _____________________

---

**Inspección 1131** - Sistema de Registro Documental
Versión 1.0.0
