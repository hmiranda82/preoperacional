// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // El formateo de código es responsabilidad de Prettier (que se ejecuta
      // como paso aparte), no del lint. Así el lint se centra en errores reales
      // de código sin generar ruido por el estilo del proyecto.
      // `no-explicit-any` como advertencia: el backend trabaja con `any`
      // explícito (noImplicitAny: false) en múltiples servicios; se mantiene la
      // señal sin bloquear el lint ni forzar un retipado masivo y arriesgado.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
